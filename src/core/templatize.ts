import type { CheerioAPI } from "cheerio";
import { loadHtml } from "./load-html.js";

/**
 * Apply an HTML template to a page fragment.
 *
 * The template uses `{{title}}` and `{{content}}` string placeholders.
 * Legacy templates that instead contain a `<content>` element, a
 * `.container` wrapper, or only a `<body>` are also supported: the page
 * HTML is injected at the first matching target so existing templates
 * keep their layout.
 *
 * @param $page - The page CheerioAPI fragment (wrapped in `<temp>`)
 * @param template - The HTML template string with placeholders
 * @param fallbackTitle - Title to use if the page has no H1 heading
 * @returns The templated HTML string
 */
export function templatize($page: CheerioAPI, template: string, fallbackTitle = "") {
	const title = $page("h1").text().trim() || fallbackTitle;
	const pageHtml = $page("temp").html() ?? "";

	if (template.includes("{{content}}")) {
		// Use replacer functions so $-sequences in content/title are inserted verbatim.
		// String.replace would otherwise interpret $&, $$, $`, and $' as special patterns.
		return template
			.replace("{{title}}", () => title)
			.replace("{{content}}", () => pageHtml);
	}

	const $template = loadHtml(template);
	// Legacy templates target the first available injection point in this
	// priority order: <content> element, then .container, then <body>.
	const $targets = $template("content").first().length
		? $template("content").first()
		: $template(".container").first().length
			? $template(".container").first()
			: $template("body").first();
	if (!$targets.length) {
		return pageHtml;
	}

	$template("title").text(title);
	if ($targets.is("content")) {
		$targets.replaceWith(pageHtml);
	} else if ($targets.is(".container")) {
		$targets.html(pageHtml);
	} else {
		$targets.prepend(pageHtml);
	}

	return $template.html() ?? "";
}
