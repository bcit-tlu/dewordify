import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convert, defaultStyleMap, defaultTemplate } from "../core/index.js";
import type { MarkoutMap, Stats, Message } from "../core/index.js";
import { nodeConverter } from "./converter.js";
import { chooseDocx, findUp, loadAssets, writeOutputFiles } from "./files.js";
import { munch } from "./munch.js";
import { serve } from "./serve.js";
import { strip } from "./strip.js";

const commands = ["dewordify", "munch", "estimate", "strip", "serve"];

/**
 * Main entry point for the CLI.
 * Dispatches to the appropriate sub-command based on the command name.
 */
export async function run(command?: string, fileArg?: string) {
	if (command === "--version" || command === "-v" || fileArg === "--version" || fileArg === "-v") {
		printVersion();
		return;
	}
	const cwd = process.cwd();
	const cmd = command && commands.includes(command) ? command : "dewordify";

	switch (cmd) {
		case "munch":
			munch(cwd);
			return;
		case "strip":
			strip(cwd);
			return;
		case "serve":
			serve(fileArg ? parseInt(fileArg, 10) : 3000);
			return;
		case "estimate":
			await dewordify(cwd, fileArg, false);
			return;
		default:
			await dewordify(cwd, fileArg, true);
	}
}

/** Print the package version and when dist/ was built, warning if stale. */
function printVersion() {
	const pkgPath = new URL("../../package.json", import.meta.url);
	const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version: string };
	const builtAt = fs.statSync(fileURLToPath(import.meta.url)).mtime;
	console.log(`dewordify ${pkg.version} (cli built ${builtAt.toISOString()})`);

	// Warn when src/ is available and contains .ts files newer than the compiled output.
	// Only meaningful in a repo checkout.
	// Installed copies ship src/ without tsconfig, so build:cli can't rebuild there.
	// Tarball extraction order can also leave src files with newer mtimes than dist on a fresh install.
	const tsconfigPath = new URL("../../tsconfig.cli.json", import.meta.url);
	const srcDir = fileURLToPath(new URL("../../src", import.meta.url));
	if (!fs.existsSync(tsconfigPath) || !fs.existsSync(srcDir)) return;
	let newestSrc = 0;
	const dirs = [srcDir];
	while (dirs.length) {
		const dir = dirs.pop()!;
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				dirs.push(full);
			} else if (entry.name.endsWith(".ts")) {
				newestSrc = Math.max(newestSrc, fs.statSync(full).mtimeMs);
			}
		}
	}
	if (newestSrc > builtAt.getTime()) {
		console.log(`[WARNING] dist/ is older than src/ — run 'npm run build:cli' to rebuild.`);
	}
}

/**
 * Run the dewordify conversion on a DOCX file.
 * Loads custom style maps, markout maps, and templates if found,
 * then runs the conversion pipeline and writes output files.
 */
async function dewordify(cwd: string, fileArg: string | undefined, writePages: boolean) {
	const docxPath = chooseDocx(cwd, fileArg);
	console.log("Converting " + path.basename(docxPath));

	const styleMapPath = findUp("styleMap.txt", cwd);
	const markoutMapPath = findUp("markoutMap.json", cwd);
	const templatePath = findUp("template.html", cwd);

	let styleMap = defaultStyleMap;
	if (styleMapPath) {
		const custom = fs.readFileSync(styleMapPath, "utf8").replace(/\r\n/g, "\n").split("\n");
		styleMap = [...defaultStyleMap, ...custom];
		console.log("Using custom styleMap: " + styleMapPath);
	}

	let markoutMap: MarkoutMap | undefined;
	if (markoutMapPath) {
		markoutMap = JSON.parse(fs.readFileSync(markoutMapPath, "utf8")) as MarkoutMap;
		console.log("Using custom markoutMap: " + markoutMapPath);
	}

	let template: string | undefined;
	if (templatePath) {
		template = fs.readFileSync(templatePath, "utf8");
		console.log("Using custom template: " + templatePath);
	}

	const result = await convert(new Uint8Array(fs.readFileSync(docxPath)), {
		converter: nodeConverter,
		styleMap,
		markoutMap,
		template,
		assets: loadAssets(cwd),
		writePages,
		documentName: path.basename(docxPath).replace(/\.docx$/i, "")
	});

	printMessages(result.messages);
	printStats(result.stats);

	if (writePages) {
		writeOutputFiles(cwd, result.files);
	}
}

/** Print conversion messages to stdout with severity labels. */
function printMessages(messages: Message[]) {
	for (const message of messages) {
		const label = message.level.toUpperCase();
		console.log(`[${label}] (${message.source}) ${message.text}`);
	}
}

/** Print conversion statistics to stdout. */
function printStats(stats: Stats) {
	if (stats.structures.length) {
		console.log("\n[INFO] Summary");
		for (const structure of stats.structures) {
			console.log(`\t${structure.name}:\t${structure.count}${structure.hint ? " " + structure.hint : ""}`);
		}
	}
	if (stats.learningBlocks.length) {
		console.log("\n[INFO] Learning Blocks");
		for (const marker of stats.learningBlocks) {
			console.log(`\t${marker.name}: ${marker.count}`);
		}
	}
}
