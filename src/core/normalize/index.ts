import type { CheerioAPI } from "cheerio";
import type { ConvertContext } from "../types.js";
import { normalizeHeadings } from "./normalize-headings.js";
import { normalizeImages } from "./normalize-images.js";
import { normalizeLists } from "./normalize-lists.js";
import { convertBreaks } from "./convert-breaks.js";
import { whitespace } from "./whitespace.js";
import { combineAdjacentTags } from "./combine-adjacents.js";
import { trimInlineTags, trimBlockTags } from "./trim.js";
import { links } from "./links.js";
import { removeEmptyTags } from "./remove-empty-tags.js";
import { normalizeComments } from "./normalize-comments.js";

/**
 * Normalize a mammoth-generated HTML fragment by applying a series of
 * structural cleanup transformations.
 *
 * The pipeline runs in a specific order: headings → images → lists →
 * breaks → whitespace → adjacent tag merging → trimming → links →
 * empty tag removal → comments. Each step prepares the DOM for the next.
 *
 * @param $ - The CheerioAPI fragment to normalize (mutated in place)
 * @param ctx - Conversion context (used for heading normalization messages)
 */
export function normalize($: CheerioAPI, ctx: ConvertContext) {
	normalizeHeadings($, ctx);
	normalizeImages($);
	normalizeLists($);
	convertBreaks($);
	whitespace($);
	combineAdjacentTags($);
	trimInlineTags($);
	trimBlockTags($);
	links($);
	removeEmptyTags($);
	normalizeComments($);
}
