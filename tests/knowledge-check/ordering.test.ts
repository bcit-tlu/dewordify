import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("knowledge-check", "ordering");

describe("knowledge-check/ordering", () => {
	it("converts the guide's Word example preserving the ordered sequence", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const kc = output("div.knowledge-check");
		expect(kc.length).toBe(1);
		const items = kc.find("ol ol li").map((_, el) => output(el).text()).get();
		expect(items).toEqual(["Phylum", "Class", "Order", "Family", "Genus", "Species"]);
		expect(norm(kc.text())).toBe(norm(expected("div.knowledge-check").text()));
	});
});
