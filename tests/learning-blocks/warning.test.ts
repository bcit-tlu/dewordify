import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "warning");

describe("learning-blocks/warning", () => {
	it("converts the guide's Word example into div.warning matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.warning");
		expect(block.length).toBe(1);
		expect(norm(block)).toBe(norm(expected("div.warning")));
	});
});
