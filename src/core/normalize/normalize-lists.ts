import type { CheerioAPI } from "cheerio";

/**
 * Combine adjacent lists of the same type (`<ol>` or `<ul>`).
 * Word sometimes splits a single logical list into multiple HTML list
 * elements; this merges them back together.
 */
export function normalizeLists($: CheerioAPI) {
	$("ol + ol, ul + ul").each(function () {
		const html = $(this).prev().html();
		$(this).prepend(html ?? "");
		$(this).prev().remove();
	});
}
