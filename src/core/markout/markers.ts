import type { CheerioAPI } from "cheerio";
import type { ConvertContext } from "../types.js";
import { filterMarkers, wrapAllHtml } from "./helpers.js";

const expectedMarkerTags = "p, h1, h2, h3, h4, h5, h6";

/**
 * Normalize marker names using the mappings from the markout map.
 * Renames alias markers (e.g., `#doc` → `#audio`) to their canonical names.
 */
export function normalizeMarkers($: CheerioAPI, ctx: ConvertContext) {
	const markoutMap = ctx.markoutMap;
	const mappedNames = Object.keys(markoutMap.mappings);

	for (const mappedName of mappedNames) {
		const markerStart = markoutMap.start + mappedName;
		const $start = filterMarkers($, $(expectedMarkerTags), markerStart);
		const newMarkerStart = markoutMap.start + markoutMap.mappings[mappedName];
		$start.text(newMarkerStart);

		const markerEnd = markoutMap.end + mappedName;
		const $end = filterMarkers($, $(expectedMarkerTags), markerEnd);
		const newMarkerEnd = markoutMap.end + markoutMap.mappings[mappedName];
		$end.text(newMarkerEnd);
	}
}

/**
 * Convert marker pairs (e.g., `#image` ... `/image`) into HTML wrapper elements.
 *
 * For each marker type defined in the markout map, finds matching start and
 * end markers, wraps the content between them in the corresponding wrapper
 * HTML, and removes the marker elements themselves.
 */
export function convertMarkers($: CheerioAPI, ctx: ConvertContext) {
	const markoutMap = ctx.markoutMap;
	const markerNames = Object.keys(markoutMap.wrappers);

	for (const markerName of markerNames) {
		const markerStart = markoutMap.start + markerName;
		const markerEnd = markoutMap.end + markerName;
		const $start = filterMarkers($, $(expectedMarkerTags), markerStart);
		const $end = filterMarkers($, $(expectedMarkerTags), markerEnd);
		const wrapper = markoutMap.wrappers[markerName];

		if ($start.length) {
			$end.each(function () {
				const $contents = $(this).prevUntil($start);
				$contents.prev().remove();
				$contents.next().remove();
				wrapAllHtml($, $contents, wrapper, true);
			});
		}
	}
}

/**
 * Report markers that are unknown (not in the markout map) or mismatched
 * (unequal numbers of start and end markers) as error messages.
 */
export function reportInvalidMarkers($: CheerioAPI, ctx: ConvertContext) {
	const markoutMap = ctx.markoutMap;
	const markerNames = Object.keys(markoutMap.wrappers);
	const unknownMarkers: Record<string, number> = {};
	const missingMarkers: Record<string, number> = {};

	$(expectedMarkerTags).each(function () {
		const text = $(this).text();
		const firstChar = text.charAt(0);
		const isMarker = firstChar === markoutMap.start || firstChar === markoutMap.end;
		const isUnknown = markerNames.indexOf(text.slice(1)) === -1;
		if (isMarker && isUnknown) {
			unknownMarkers[text] = (unknownMarkers[text] ?? 0) + 1;
		}
	});

	for (const markerName of markerNames) {
		const $start = filterMarkers($, $(expectedMarkerTags), markoutMap.start + markerName);
		const $end = filterMarkers($, $(expectedMarkerTags), markoutMap.end + markerName);

		if ($start.length !== $end.length) {
			missingMarkers[markoutMap.start + markerName] = $start.length;
			missingMarkers[markoutMap.end + markerName] = $end.length;
		}
	}

	const sortedUnknown = sortKeys(unknownMarkers);
	const sortedMissing = sortKeys(missingMarkers);

	if (sortedUnknown.length || sortedMissing.length) {
		if (sortedUnknown.length) {
			ctx.messages.push({
				level: "error",
				source: "markout",
				text: `Unknown markers on "${ctx.pageFilename}": ${sortedUnknown.map((key) => `${key} (x${unknownMarkers[key]})`).join(", ")}`
			});
		}
		if (sortedMissing.length) {
			ctx.messages.push({
				level: "error",
				source: "markout",
				text: `Mismatched start/end markers on "${ctx.pageFilename}": ${sortedMissing.map((key) => `${key} (x${missingMarkers[key]})`).join(", ")}`
			});
		}
	}
}

function sortKeys(markers: Record<string, number>) {
	return Object.keys(markers).sort(function (a, b) {
		const sliceA = a.slice(1).toLowerCase();
		const sliceB = b.slice(1).toLowerCase();
		if (sliceA < sliceB) return -1;
		if (sliceA > sliceB) return 1;
		return 0;
	});
}
