import fs from "node:fs";
import path from "node:path";

/**
 * Search for a file by walking up the directory tree from `startDir`.
 * Used to find optional config files (styleMap.txt, markoutMap.json, template.html).
 */
export function findUp(fileName: string, startDir: string, levels = 3): string | null {
	let dir = path.resolve(startDir);
	for (let i = 0; i <= levels; i++) {
		const candidate = path.join(dir, fileName);
		if (fs.existsSync(candidate)) {
			return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * Resolve the DOCX file to convert. If an explicit file argument is given,
 * resolve it relative to cwd. Otherwise, find the most recently modified
 * .docx file in the current directory.
 */
export function chooseDocx(cwd: string, explicitFile?: string): string {
	if (explicitFile) {
		const resolved = path.resolve(cwd, explicitFile);
		if (!fs.existsSync(resolved)) {
			throw new Error(`File not found: ${resolved}`);
		}
		return resolved;
	}

	const docxFiles = fs.readdirSync(cwd)
		.filter((item) => path.extname(item).toLowerCase() === ".docx")
		.map((item) => {
			const filePath = path.join(cwd, item);
			return { filePath, mtime: fs.statSync(filePath).mtimeMs };
		})
		.sort((a, b) => b.mtime - a.mtime);

	if (!docxFiles.length) {
		throw new Error("No .docx files found in " + cwd);
	}

	return docxFiles[0].filePath;
}

/**
 * Load all files from an `assets/` subdirectory into a Map keyed by filename.
 * Returns an empty Map if the directory doesn't exist.
 */
export function loadAssets(cwd: string): Map<string, Uint8Array> {
	const assets = new Map<string, Uint8Array>();
	const assetsDir = path.join(cwd, "assets");

	if (fs.existsSync(assetsDir)) {
		for (const item of fs.readdirSync(assetsDir)) {
			const filePath = path.join(assetsDir, item);
			if (fs.statSync(filePath).isFile()) {
				assets.set(item, new Uint8Array(fs.readFileSync(filePath)));
			}
		}
	}

	return assets;
}

/**
 * Write output files to disk, creating parent directories as needed.
 * String data is written as UTF-8 text; Uint8Array data is written as binary.
 */
export function writeOutputFiles(cwd: string, files: { filename: string; data: string | Uint8Array }[]) {
	const root = path.resolve(cwd);
	for (const file of files) {
		const filePath = path.resolve(root, file.filename);
		// Generated filenames derive from document content.
		// Refuse any that would escape the working directory.
		if (!filePath.startsWith(root + path.sep)) {
			throw new Error(`Refusing to write outside output directory: ${file.filename}`);
		}
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		if (typeof file.data === "string") {
			fs.writeFileSync(filePath, file.data, "utf8");
		} else {
			fs.writeFileSync(filePath, Buffer.from(file.data));
		}
		console.log("Wrote " + file.filename);
	}
}
