import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "knowing");

describe("learning-blocks/knowing", () => {
	it("converts the guide's Word example into div.knowing matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.knowing");
		expect(block.length).toBe(1);
		expect(norm(block)).toBe(norm(expected("div.knowing")));
	});
});
