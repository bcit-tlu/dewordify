import type { CheerioAPI } from "cheerio";

function baseName(filePath: string) {
	return filePath.split(/[\\/]/).pop() ?? filePath;
}

/**
 * Normalize anchor elements: remove `<a>` tags without `href` attributes
 * (Word artifacts), and rewrite `file:` or relative links to `assets/` paths.
 */
export function links($: CheerioAPI) {
	$("a").each(function () {
		if (!$(this).attr("href")) {
			$(this).replaceWith($(this).html() ?? "");
		}
	});

	$("a[href^='file:']").each(function () {
		const href = $(this).attr("href") ?? "";
		$(this).attr("href", "assets/" + baseName(href));
	});

	$("a[href]:not([href*=':'])").each(function () {
		const href = $(this).attr("href") ?? "";
		$(this).attr("href", "assets/" + baseName(href));
	});
}
