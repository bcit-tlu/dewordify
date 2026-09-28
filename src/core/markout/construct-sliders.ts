import type { CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import { wrapAllHtml } from "./helpers.js";

/**
 * Construct image sliders from `.slider` wrapper elements.
 *
 * Groups children into slides at H2 or img boundaries. Each slide is
 * wrapped in a `<figure>` element. H2s without a following img get a
 * placeholder img inserted.
 */
export function constructSliders($: CheerioAPI) {
	$(".slider").each(function () {
		// Track slide membership by node reference rather than index.
		// Inserted placeholder <img> elements shift live child indices.
		// Pre-captured index bounds would then point at the wrong nodes.
		const slides: AnyNode[][] = [];
		let current: AnyNode[] | null = null;

		$(this)
			.children()
			.each(function () {
				const isHeader = $(this).is("h2");
				const isImage = $(this).is("img");

				if (isHeader) {
					if (current) slides.push(current);
					current = [this];
					if (!$(this).next().is("img")) {
						const $placeholder = $("<img>");
						$(this).after($placeholder);
						current.push($placeholder[0]);
					}
				} else if (isImage && !current) {
					current = [this];
				} else if (current) {
					current.push(this);
				}
			});

		if (current) slides.push(current);

		for (let i = slides.length - 1; i >= 0; i--) {
			wrapAllHtml($, $(slides[i]), "<figure>");
		}
		$(this).children("figure").addClass("img");
	});
}
