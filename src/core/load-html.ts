import { load } from "cheerio/slim";

const options = { xml: { xmlMode: false, decodeEntities: false } };

/** Load an HTML string as a CheerioAPI instance for DOM manipulation. */
export function loadHtml(html: string) {
	return load(html, options, false);
}

/**
 * Load an HTML fragment string wrapped in a `<temp>` tag.
 * The `<temp>` wrapper allows fragment-level operations (e.g., selecting
 * top-level siblings) that would be lost in a full document parse.
 */
export function loadFragment(html: string) {
	return load("<temp>" + html + "</temp>", options, false);
}
