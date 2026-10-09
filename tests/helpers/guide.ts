import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import { loadHtml, loadFragment } from "../../src/core/load-html.js";
import { markout, defaultMarkoutMap } from "../../src/core/index.js";
import type { ConvertContext } from "../../src/core/index.js";

const guideDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/guide");

export function guideExample(category: string, name: string) {
	const file = fs.readFileSync(path.join(guideDir, category, name + ".html"), "utf8");
	const $ = loadHtml(file);
	return {
		word: $("word").html() ?? "",
		preview: $("preview").html() ?? ""
	};
}

export function convertWord(wordHtml: string, assets = new Map<string, Uint8Array>()) {
	const ctx: ConvertContext = { markoutMap: defaultMarkoutMap, assets, messages: [] };
	const $page = loadFragment("<h1>Page</h1>" + wordHtml);
	markout([$page], ctx);
	return loadHtml($page("temp").html() ?? "");
}

export function previewDoc(previewHtml: string) {
	return loadHtml(previewHtml);
}

const BLOCK_ELEMENTS = "address,article,aside,blockquote,br,dd,div,dl,dt,figcaption,figure,footer,h1,h2,h3,h4,h5,h6,header,hr,li,main,nav,ol,p,pre,section,table,tbody,td,tfoot,th,thead,tr,ul";

export function norm(input: string | Cheerio<AnyNode> | undefined) {
	if (typeof input === "string" || input === undefined) {
		return (input ?? "").replace(/\s+/g, " ").trim();
	}
	const clone = input.clone();
	clone.find(BLOCK_ELEMENTS).after(" ");
	return clone.text().replace(/\s+/g, " ").trim();
}
