import type { CheerioAPI } from "cheerio";

/**
 * Construct interactions from `pre.interaction` wrapper elements.
 *
 * The `#interaction` marker wraps raw HTML embed code (e.g., H5P iframes)
 * in a `<pre class="interaction">` element. Because the embed code originates
 * as plain text in the DOCX, it is stored as escaped text content rather than
 * actual DOM elements. This function extracts the text content and parses it
 * as HTML, replacing the `<pre>` with the real embed elements. Iframes
 * without explicit dimensions get the default 560x315 (16:9) so the runtime
 * can size them responsively.
 */
export function constructInteractions($: CheerioAPI) {
	$("pre.interaction").each(function () {
		const raw = $(this).text();
		const decoded = raw
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&amp;/g, "&");
		const $embed = $("<div>").html(decoded);
		$embed.find("iframe").each(function () {
			if (!$(this).attr("width")) $(this).attr("width", "560");
			if (!$(this).attr("height")) $(this).attr("height", "315");
			// Keep an identifying class so stats can count interactions after the pre.interaction wrapper is discarded.
			$(this).addClass("interaction");
		});
		$(this).replaceWith($embed.contents());
	});
}
