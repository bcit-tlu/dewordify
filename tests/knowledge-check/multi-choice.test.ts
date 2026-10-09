import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("knowledge-check", "multi-choice");

describe("knowledge-check/multi-choice", () => {
	it("converts the guide's Word example preserving answers and feedback markers", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const kc = output("div.knowledge-check");
		expect(kc.length).toBe(1);
		expect(kc.find("> ul > li").length).toBe(2);
		expect(kc.text()).toContain("*2017");
		expect(kc.text()).toContain("*True");
		expect(kc.text()).toContain("@ The old BCIT logo was stylized text");
		expect(norm(kc.text())).toBe(norm(expected("div.knowledge-check").text()));
	});
});
