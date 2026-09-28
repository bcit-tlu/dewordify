import type { CheerioAPI } from "cheerio";
import type { ConvertContext } from "../types.js";

/**
 * Normalize headings by promoting `span.headingN` elements (produced by
 * mammoth's style map) to proper `h1`–`h6` tags, and moving `h1` elements
 * to the top level of the DOM.
 *
 * Also strips inline formatting (`<strong>`, `<em>`, `<i>`, `<b>`) from
 * inside headings, since heading styles should be controlled by CSS.
 */
export function normalizeHeadings($: CheerioAPI, ctx: ConvertContext) {
	for (let i = 1; i < 9; i++) {
		$(".heading" + i).each(function () {
			if ($(this).parents("h" + i).length > 0) {
				$(this).replaceWith($(this).html() ?? "");
				return true;
			}
			const $p = $(this).parents("p").first();
			if (!$p.length) {
				ctx.messages.push({
					level: "error",
					source: "normalize",
					text: `Search the output for class="heading${i}"`
				});
				return true;
			}
			if ($(this).text().length === $p.text().length) {
				$p.replaceWith("<h" + i + ">" + ($(this).html() ?? "") + "</h" + i + ">");
				return true;
			}
			return true;
		});
	}

	$("h1,h2,h3,h4,h5,h6").each(function () {
		// Loop until no inline formatting remains.
		// replaceWith reparses inner HTML, so nested tags (e.g. <strong><em>x</em></strong>) become fresh elements.
		// A single .each pass then skips the now-detached originals, leaving reparsed descendants behind.
		let $formatted = $(this).find("strong,em,i,b");
		while ($formatted.length) {
			$formatted.each(function () {
				$(this).replaceWith($(this).html() ?? "");
			});
			$formatted = $(this).find("strong,em,i,b");
		}
	});

	$("h1").each(function () {
		const $parents = $(this).parents();

		if ($parents.length - 1) {
			const $eldest = $parents.eq($parents.length - 2);
			$eldest.before($(this));
		}
	});
}
