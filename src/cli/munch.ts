import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio/slim";
import { beautify } from "../core/beautify.js";
import { sanitizeFileName } from "../core/filenames.js";

export function munch(cwd: string) {
	const assetsFolder = path.join(cwd, "assets");

	const htmlFiles = fs.readdirSync(cwd).filter((item) => path.extname(item) === ".html");
	const assetFiles = fs.existsSync(assetsFolder) ? fs.readdirSync(assetsFolder) : [];

	const htmlChanges: string[] = [];
	const htmlSkipped: string[] = [];
	const assetChanges: string[] = [];
	const assetSkipped: string[] = [];

	for (const item of assetFiles) {
		const newName = sanitizeFileName(item);
		const oldPath = path.join(assetsFolder, item);
		const newPath = path.join(assetsFolder, newName);
		if (oldPath === newPath) {
			pushUnique(assetSkipped, path.relative(cwd, newPath));
		} else {
			fs.renameSync(oldPath, newPath);
			pushUnique(assetChanges, path.relative(cwd, newPath));
		}
	}

	for (const item of htmlFiles) {
		const filePath = path.join(cwd, item);
		const $ = load(fs.readFileSync(filePath, "utf8"), { xml: { xmlMode: false, decodeEntities: false } });

		$("[href],[src]").each(function () {
			let attribute = "href";
			let value = $(this).attr(attribute);
			if (!value) {
				attribute = "src";
				value = $(this).attr(attribute);
			}
			if (!value) return;
			value = decodeURI(value);
			value = value.split(/[\\/]/).join("/");
			if (value.startsWith("assets/")) {
				const dir = path.posix.dirname(value);
				const base = path.posix.basename(value);
				const newPath = path.posix.join(dir, sanitizeFileName(base));
				$(this).attr(attribute, newPath);
				if (value === newPath) {
					pushUnique(htmlSkipped, newPath);
				} else {
					pushUnique(htmlChanges, newPath);
				}
			}
		});

		fs.writeFileSync(filePath, beautify($.html()));
	}

	const allHTML = htmlChanges.concat(htmlSkipped);
	const allAssets = assetChanges.concat(assetSkipped);

	const missingFiles = allHTML.filter((item) => allAssets.indexOf(item) === -1);
	const unknownAssets = allAssets.filter((item) => allHTML.indexOf(item) === -1);

	console.log("missingFiles", missingFiles);
	console.log("unknownAssets", unknownAssets);
}

function pushUnique(array: string[], item: string) {
	if (array.indexOf(item) === -1) {
		array.push(item);
		return true;
	}
	return false;
}
