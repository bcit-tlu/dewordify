import type { CheerioAPI } from "cheerio";

/**
 * Move images out of paragraph and heading elements to become siblings.
 * Word often embeds images inside `<p>` tags; this ensures images are
 * block-level elements in the output.
 */
export function normalizeImages($: CheerioAPI) {
	$("img").each(function () {
		const $parents = $(this).parents("p,h1,h2,h3,h4,h5,h6");
		const $eldest = $parents.last();
		if ($parents.length) {
			$eldest.before($(this));
		}
	});
}
