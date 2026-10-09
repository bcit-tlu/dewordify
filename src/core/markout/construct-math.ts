import type { CheerioAPI } from "cheerio";
import { buildFigcaption } from "./helpers.js";

/**
 * Construct math figures by moving the first child element (typically an
 * image of the rendered equation) into the figure's figcaption area.
 */
export function constructMath($: CheerioAPI) {
	$("figure.math").each(function () {
		const $first = $(this).children().first().clone();
		$(this).children().first().remove();
		buildFigcaption($, $(this), "", $first);
	});
}
