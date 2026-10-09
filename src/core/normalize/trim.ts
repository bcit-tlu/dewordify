import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

/** Trim leading/trailing whitespace from inline elements, moving spaces outside the tag. */
function trimInline($: CheerioAPI, $selection: Cheerio<Element>) {
	$selection.each(function () {
		let text = $(this).html() ?? "";
		if (text.charAt(0) === " ") {
			$(this).before(" ");
			text = text.substring(1);
		}
		if (text.charAt(text.length - 1) === " ") {
			$(this).after(" ");
			text = text.substring(0, text.length - 1);
		}

		if (text !== ($(this).html() ?? "")) {
			$(this).html(text);
		}
	});
}

/** Trim leading/trailing whitespace from block-level element inner HTML. */
function trimBlock($: CheerioAPI, $selection: Cheerio<Element>) {
	$selection.each(function () {
		$(this).html(($(this).html() ?? "").trim());
	});
}

/** Trim whitespace from all inline elements (span, strong, em, a, i, b). */
export function trimInlineTags($: CheerioAPI) {
	trimInline($, $("span"));
	trimInline($, $("strong"));
	trimInline($, $("em"));
	trimInline($, $("a"));
	trimInline($, $("i"));
	trimInline($, $("b"));
	trimInline($, $("a,strong,em,i,b,span"));
}

/** Trim whitespace from all block-level elements (headings, paragraphs, cells, etc.). */
export function trimBlockTags($: CheerioAPI) {
	trimBlock($, $("h1"));
	trimBlock($, $("h2"));
	trimBlock($, $("h3"));
	trimBlock($, $("h4"));
	trimBlock($, $("h5"));
	trimBlock($, $("h6"));
	trimBlock($, $("p"));
	trimBlock($, $("td"));
	trimBlock($, $("th"));
	trimBlock($, $("li"));
	trimBlock($, $("blockquote"));
	trimBlock($, $("figcaption"));
	trimBlock($, $("title"));
}
