import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadHtml, loadFragment } from "../src/core/load-html.js";
import { markout, defaultMarkoutMap } from "../src/core/index.js";
import type { ConvertContext } from "../src/core/index.js";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

function makeContext(): ConvertContext {
	return { markoutMap: defaultMarkoutMap, assets: new Map(), messages: [] };
}

describe("marker parity with conversion-guide", () => {
	it("supports every marker documented in marker-reference.html", () => {
		const reference = fs.readFileSync(path.join(fixturesDir, "marker-reference.html"), "utf8");
		const $ = loadHtml(reference);

		const documented = new Set<string>();
		$("td").each(function () {
			const text = $(this).text().trim();
			const match = text.match(/^#([\w-]+)$/);
			if (match) {
				documented.add(match[1]);
			}
		});

		expect(documented.size).toBeGreaterThan(20);
		for (const marker of documented) {
			expect(
				Object.keys(defaultMarkoutMap.wrappers),
				`#${marker} is documented in the conversion guide but missing from the markout map`
			).toContain(marker);
		}
	});
});

describe("flashcards", () => {
	it("converts #flashcards markers into table.flashcards with td cells", () => {
		const input = [
			"<h1>Page</h1>",
			"<p>#flashcards</p>",
			"<table><tr><td><strong>Front</strong></td><td>Back</td></tr><tr><td><strong>Front 2</strong></td><td>Back 2</td></tr></table>",
			"<p>/flashcards</p>"
		].join("");

		const $page = loadFragment(input);
		markout([$page], makeContext());
		const output = $page("temp").html() ?? "";

		expect(output).toContain('class="flashcards"');
		expect(output).not.toContain("<figure");
		expect(output).not.toContain("<th");
		expect(output).toContain("Front");
		expect(output).toContain("Back 2");
	});

	it("accepts the #flashcard alias", () => {
		const input = "<h1>Page</h1><p>#flashcard</p><table><tr><td>A</td><td>B</td></tr></table><p>/flashcard</p>";
		const $page = loadFragment(input);
		markout([$page], makeContext());
		const output = $page("temp").html() ?? "";
		expect(output).toContain('class="flashcards"');
	});
});
