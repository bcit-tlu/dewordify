import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "outcome");

describe("learning-blocks/outcome", () => {
	it("converts the guide's Word example into div.outcome matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.outcome");
		expect(block.length).toBe(1);
		expect(norm(block)).toBe(norm(expected("div.outcome")));
	});
});
