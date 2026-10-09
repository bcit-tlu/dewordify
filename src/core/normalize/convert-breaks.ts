import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Convert `<br>` elements into proper paragraph boundaries.
 *
 * In `<li>` elements, content separated by `<br>` is wrapped in `<p>` tags.
 * In `<p>` elements, `<br>` splits the paragraph into separate `<p>` elements.
 * This converts Word's soft line breaks into structural HTML.
 */
export function convertBreaks($: CheerioAPI) {
	$("br").replaceWith("<br>");

	$("li").each(function () {
		if ($(this).children("br").length) {
			const $contents = $(this).contents();
			let selection: Cheerio<AnyNode>[] = [];
			$contents.each(function () {
				const node = this as AnyNode & { type?: string };
				if (node.type === "text" || !$(this).is("img, br, ol, ul, table, figure")) {
					if ($(this)[0] === $contents.last()[0] && $(this).text().trim().startsWith("/")) {
						$(this).wrap("<p></p>");
					}
					selection.push($(this));
				} else {
					if ($(this).is("br")) {
						$(this).remove();
					}

					if (selection.length) {
						const $p = $("<p>");
						selection[0].before($p);
						selection.forEach(function ($item) {
							$p.append($item);
						});
						selection = [];
					}
				}
			});
		}
	});

	$("p > br").each(function () {
		const thisString = ($(this).parent().html() ?? "").toString();
		const stringSegments = thisString.split("<br>");
		const newString = stringSegments.map(function (segment) {
			return "<p>" + segment + "</p>";
		}).join("");
		$(this).parent().replaceWith(newString);
	});
}
