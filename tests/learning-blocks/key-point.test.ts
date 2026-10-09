import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "key-point");

describe("learning-blocks/key-point", () => {
	it("converts the guide's Word example into div.key-point matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.key-point");
		expect(block.length).toBe(1);
		expect(norm(block.text())).toBe(norm(expected("div.key-point").text()));
	});
});
