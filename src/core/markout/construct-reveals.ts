import type { CheerioAPI } from "cheerio";
import type { ConvertContext } from "../types.js";
import { markoutPropertyValue } from "./helpers.js";

/**
 * Construct reveal interactions by extracting markout properties
 * (button text, min-text, placeholder, rows) as data attributes.
 */
export function constructReveals($: CheerioAPI, ctx: ConvertContext) {
	$(".reveal").each(function () {
		const button = markoutPropertyValue($, $(this), "button", ctx);
		const minText = markoutPropertyValue($, $(this), "min-text", ctx);
		const placeholder = markoutPropertyValue($, $(this), "placeholder", ctx);
		const rows = markoutPropertyValue($, $(this), "rows", ctx);

		if (button.length >= 1) {
			$(this).attr("data-button", button);
		}

		if (minText.length >= 1) {
			$(this).attr("data-min-text", minText);
		}

		if (placeholder.length >= 1) {
			$(this).attr("data-placeholder", placeholder);
		}

		if (rows.length >= 1) {
			$(this).attr("data-rows", rows);
		}
	});
}
