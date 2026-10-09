import type { CheerioAPI } from "cheerio";
import type { ConvertContext } from "../types.js";
import { getFileName } from "../filenames.js";
import { normalizeMarkers, convertMarkers, reportInvalidMarkers } from "./markers.js";
import { constructSliders } from "./construct-sliders.js";
import { constructImages } from "./construct-images.js";
import { constructMath } from "./construct-math.js";
import { constructAudio } from "./construct-audio.js";
import { constructVideos } from "./construct-videos.js";
import { tables } from "./construct-tables.js";
import { constructFlashcards } from "./construct-flashcards.js";
import { constructReveals } from "./construct-reveals.js";
import { constructComments } from "./construct-comments.js";
import { constructInteractions } from "./construct-interactions.js";

/**
 * Transform Word marker syntax (e.g., `#image ... /image`) into structured HTML.
 *
 * Each page is processed through: marker normalization (mapping aliases),
 * invalid marker reporting, marker-to-wrapper conversion, then a series of
 * content constructors that build out figures, tables, interactions, and
 * other structured elements from the marker wrappers.
 *
 * @param pages - Array of CheerioAPI page fragments (mutated in place)
 * @param ctx - Conversion context with markout map, assets, and message collection
 */
export function markout(pages: CheerioAPI[], ctx: ConvertContext) {
	pages.forEach(function ($, index) {
		ctx.pageFilename = getFileName(index + 1, $("h1").text().trim() || "untitled", ".html");
		markoutPage($, ctx);
	});
}

/** Run all markout transformations on a single page. */
function markoutPage($: CheerioAPI, ctx: ConvertContext) {
	normalizeMarkers($, ctx);
	reportInvalidMarkers($, ctx);
	convertMarkers($, ctx);
	constructSliders($);
	constructImages($, ctx);
	constructMath($);
	constructAudio($, ctx);
	constructVideos($, ctx);
	tables($, ctx);
	constructFlashcards($);
	constructReveals($, ctx);
	constructInteractions($);
	constructComments($);
}
