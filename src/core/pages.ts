import type { CheerioAPI } from "cheerio";
import { getFileName, safeExtensionOf } from "./filenames.js";
import { templatize } from "./templatize.js";
import { beautify } from "./beautify.js";
import type { ConvertContext, OutputFile } from "./types.js";

/**
 * Generate output files from processed page fragments.
 *
 * Pages whose H1 text contains a linked file pattern (e.g., "(report.pdf)")
 * produce a data file and a TOC JSON entry instead of an HTML page.
 * All other pages are templated and beautified into HTML files.
 *
 * @param pages - Array of CheerioAPI page fragments
 * @param template - HTML template string with `{{title}}` and `{{content}}` placeholders
 * @param ctx - Conversion context for assets and messages
 * @param fallbackName - Name to use when a page has no H1 heading
 * @returns Array of output files (HTML pages, data files, TOC JSON entries)
 */
export function generatePages(pages: CheerioAPI[], template: string, ctx: ConvertContext, fallbackName = "untitled") {
	const files: OutputFile[] = [];

	pages.forEach(function ($page, index) {
		files.push(...createPage($page, template, index + 1, ctx, fallbackName));
	});

	return files;
}

/**
 * Create output files for a single page.
 *
 * Handles both regular pages (producing an HTML file) and linked-file
 * pages (producing a data file and TOC JSON entry). Linked files are
 * identified by a filename pattern in the H1 text.
 */
function createPage($page: CheerioAPI, template: string, pageNumber: number, ctx: ConvertContext, fallbackName: string): OutputFile[] {
	const h1Text = $page("h1").text().trim() || fallbackName;
	const linkedFilePattern = /(\(|\[).+?\..+?(\)|\])/g;
	const matches = h1Text.match(linkedFilePattern);

	if (!matches) {
		const htmlFileName = getFileName(pageNumber, h1Text, ".html");
		const page = templatize($page, template, h1Text);
		return [{ filename: htmlFileName, data: beautify(page) }];
	}

	if (matches.length > 1) {
		ctx.messages.push({
			level: "error",
			source: "pages",
			text: `Linked files need to be separated. See: ${getFileName(pageNumber, h1Text, ".html")}`
		});
	}

	const match = matches[0];
	const startIndex = h1Text.indexOf(match);
	const endIndex = startIndex + match.length;
	const title = (h1Text.slice(0, startIndex) + h1Text.slice(endIndex)).trim();
	const linkedFileName = match.slice(1, -1).trim();
	// The extension comes from untrusted heading text.
	// Only accept simple extensions so a crafted name can't put path traversal segments into the generated filename.
	const ext = safeExtensionOf(linkedFileName);
	const newFileName = getFileName(pageNumber, title, ext);
	const tocFileName = newFileName.slice(0, newFileName.length - ext.length) + "._toc.json";

	const files: OutputFile[] = [];

	const assetData = ctx.assets.get(linkedFileName);
	if (assetData !== undefined) {
		files.push({ filename: newFileName, data: assetData });
	} else {
		ctx.messages.push({
			level: "error",
			source: "pages",
			text: `Linked file is not in the assets folder. See: ${newFileName}`
		});
	}

	$page("h1").remove();
	const description = ($page("temp").html() ?? "").trim();

	const fileData = {
		title: title,
		linkedFileName: newFileName,
		sourceFileName: "assets/" + linkedFileName,
		description: description
	};

	files.push({ filename: tocFileName, data: JSON.stringify(fileData, null, "\t") });

	return files;
}
