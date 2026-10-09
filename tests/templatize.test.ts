import { describe, expect, it } from "vitest";
import { loadFragment } from "../src/core/load-html.js";
import { templatize } from "../src/core/templatize.js";

const page = (html: string) => loadFragment("<h1>My Page</h1>" + html);

describe("templatize", () => {
	it("injects content at {{content}} and sets {{title}}", () => {
		const out = templatize(
			page("<p>Hello</p>"),
			"<html><head><title>{{title}}</title></head><body><main>{{content}}</main></body></html>"
		);
		expect(out).toContain("<title>My Page</title>");
		expect(out).toContain("<main>");
		expect(out).toContain("<p>Hello</p>");
	});

	it("preserves $-sequences in content verbatim", () => {
		const out = templatize(
			page("<p>Costs $$, $&amp;, $&grave;, $'</p>"),
			"<html><head><title>{{title}}</title></head><body>{{content}}</body></html>"
		);
		expect(out).toContain("$$");
		expect(out).not.toContain("{{content}}");
	});

	it("injects into a legacy <content> element when {{content}} is missing", () => {
		const out = templatize(
			page("<p>Hello</p>"),
			"<html><head><title>Old</title></head><body><div class=\"wrap\"><content></content></div></body></html>"
		);
		expect(out).toContain("<title>My Page</title>");
		expect(out).toContain("<div class=\"wrap\">");
		expect(out).toContain("<p>Hello</p>");
		expect(out).not.toContain("<content>");
	});

	it("injects into a .container wrapper when no <content> element exists", () => {
		const out = templatize(
			page("<p>Hello</p>"),
			"<html><head><title>Old</title></head><body><div class=\"container\"></div></body></html>"
		);
		expect(out).toContain("<div class=\"container\">");
		expect(out).toContain("<p>Hello</p>");
	});

	it("prepends into <body> when no <content> or .container exists", () => {
		const out = templatize(
			page("<p>Hello</p>"),
			"<html><head><title>Old</title></head><body></body></html>"
		);
		expect(out).toContain("<body>");
		expect(out).toContain("<p>Hello</p>");
		expect(out).toContain("<title>My Page</title>");
	});
});
