import type { CheerioAPI } from "cheerio";

/** Convert `.html-comment` div elements into actual HTML comments. */
export function constructComments($: CheerioAPI) {
	$(".html-comment").each(function () {
		$(this).replaceWith("<!--\n" + ($(this).html() ?? "") + "\n-->");
	});
}
