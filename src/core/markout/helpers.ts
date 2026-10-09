import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { ConvertContext } from "../types.js";

const markoutPropertyDelimiter = ":";

/** Filter a selection to elements whose text content exactly matches a marker. */
export function filterMarkers($: CheerioAPI, selection: Cheerio<Element>, marker: string): Cheerio<Element> {
	return selection.filter(function () {
		return $(this).text().toLowerCase().trim() === marker;
	});
}

/** Find child elements whose text starts with a markout property prefix (e.g., "title:"). */
export function findByMarkoutProperty($: CheerioAPI, selection: Cheerio<Element>, prop: string): Cheerio<Element> {
	return selection.children().filter(function () {
		let text = $(this).text();
		if (text) {
			text = text.toLowerCase().trim();
		}
		return text.indexOf(prop.toLowerCase() + markoutPropertyDelimiter) === 0;
	});
}

/**
 * Extract the value from a markout property element (text after the `:` delimiter).
 * Reports an error if multiple property elements are found.
 */
export function getMarkoutPropertyValue($: CheerioAPI, selection: Cheerio<Element>, ctx: ConvertContext) {
	let text = selection.text();
	let array = text.split(markoutPropertyDelimiter);
	const prop = (array[0] ?? "").toLowerCase().trim();

	if (prop === "license" || prop === "licence") {
		text = selection.html() ?? "";
		array = text.split(markoutPropertyDelimiter);
	}
	array.shift();
	if (selection.length > 1) {
		ctx.messages.push({
			level: "error",
			source: "markout",
			text: `Duplicate markout properties provided. See: ${ctx.pageFilename} ${text}`
		});
	}
	return array.join(":").trim();
}

/**
 * Find a markout property, extract its value, and remove the property element.
 * Returns the property value string (empty if not found).
 */
export function markoutPropertyValue($: CheerioAPI, selection: Cheerio<Element>, prop: string, ctx: ConvertContext) {
	const $prop = findByMarkoutProperty($, selection, prop);
	const property = getMarkoutPropertyValue($, $prop, ctx);
	$prop.remove();
	return property;
}

/**
 * Wrap a selection of DOM elements in a wrapper element.
 * Moves nodes directly (no serialize/parse round-trip).
 *
 * @param $ - The CheerioAPI instance
 * @param selection - The elements to wrap
 * @param wrapper - HTML string for the wrapper element (e.g., `"<figure>"`)
 * @param reverse - If true, append items in reverse order (used when start marker precedes content)
 */
export function wrapAllHtml($: CheerioAPI, selection: Cheerio<AnyNode>, wrapper: string, reverse = false) {
	if (!selection.length) return;
	const $container = $(wrapper).clone();
	selection.first().before($container);

	if (reverse) {
		for (let i = selection.length - 1; i >= 0; i--) {
			selection.eq(i).appendTo($container);
		}
	} else {
		selection.each(function () {
			$(this).appendTo($container);
		});
	}
}

/** Check if a table cell is entirely bold (all text wrapped in `<strong>`). */
export function isCellBold($: CheerioAPI, selection: Cheerio<Element>) {
	const cellTextLength = selection.text().trim().length;
	const strongTextLength = selection.find("strong").text().trim().length;
	return cellTextLength <= strongTextLength;
}

/** Check if a table cell has no child elements and no text content. */
export function isCellEmpty($: CheerioAPI, selection: Cheerio<Element>) {
	if (selection.children().length === 0) {
		return selection.text().trim().length === 0;
	}
	return false;
}

/** Check if a table cell should be treated as a header (bold and non-empty). */
export function isCellHeader($: CheerioAPI, selection: Cheerio<Element>) {
	return isCellBold($, selection) && !isCellEmpty($, selection);
}

/** Rename a DOM element's tag name by directly mutating the node's tagName and name properties. */
export function renameElement(element: AnyNode, tagName: string) {
	const node = element as unknown as Record<string, unknown>;
	try {
		node.tagName = tagName;
	} catch {
		// tagName may be a getter-only accessor; fall through to name
	}
	node.name = tagName;
}

/**
 * Build a `<figcaption>` element from the remaining children of a figure.
 * Appends the media element and optional license footer to the figure.
 * Only appends the figcaption if it has meaningful text content.
 */
export function buildFigcaption($: CheerioAPI, $figure: Cheerio<Element>, license: string, $media?: Cheerio<AnyNode>) {
	const $figcaption = $("<figcaption>");
	const $remains = $figure.children();
	$remains.each(function () {
		if ($(this).text().length === 0) {
			$(this).remove();
		}
	});
	$figcaption.append($remains);

	if ($media && $media.length) {
		$figure.append($media);
	}

	if (license.length > 3) {
		$figcaption.append("<footer><small class='license'>" + license + "</small></footer>");
	}

	if ($figcaption.text().length > 3) {
		$figure.append($figcaption);
	}
}
