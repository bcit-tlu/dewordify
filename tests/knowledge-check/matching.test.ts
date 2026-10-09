import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("knowledge-check", "matching");

describe("knowledge-check/matching", () => {
	it("converts the guide's Word example preserving matching pairs", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const kc = output("div.knowledge-check");
		expect(kc.length).toBe(1);
		expect(kc.text()).toContain("Green = Leaf");
		expect(kc.text()).toContain("Red = Tomato");
		expect(kc.text()).toContain("Orange = Carrot");
		expect(norm(kc.text())).toBe(norm(expected("div.knowledge-check").text()));
	});
});
