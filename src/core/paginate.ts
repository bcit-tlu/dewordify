import type { CheerioAPI } from "cheerio";
import { loadFragment } from "./load-html.js";
import { wrapAllHtml } from "./markout/helpers.js";

/**
 * Split a normalized HTML fragment into individual pages at H1 boundaries.
 *
 * Each H1 heading starts a new page. Content between H1s is grouped into
 * `<page>` elements, then each page is extracted into its own CheerioAPI
 * instance by moving DOM nodes directly (no serialize/parse round-trip).
 *
 * @param $ - The normalized CheerioAPI fragment containing the full document
 * @returns An array of CheerioAPI instances, one per page
 */
export function paginate($: CheerioAPI): CheerioAPI[] {
	$("h1").first().prevAll().remove();

	$("h1").each(function () {
		wrapAllHtml($, $(this).nextUntil("h1"), "<page>");
	});

	$("page").each(function () {
		$(this).prev().prependTo($(this));
	});

	$("h1").each(function () {
		if ($(this).closest("page").length === 0) {
			$(this).wrap("<page>");
		}
	});

	if ($("page").length === 0) {
		wrapAllHtml($, $("temp").children(), "<page>");
	}

	const pages: CheerioAPI[] = [];
	$("page").each(function () {
		const $page = loadFragment("");
		$(this).children().each(function () {
			$page("temp").append($(this));
		});
		pages.push($page);
	});

	return pages;
}
