import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "reflection");

describe("learning-blocks/reflection", () => {
	it("converts the guide's Word example into div.reflection matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.reflection");
		expect(block.length).toBe(1);
		expect(norm(block.text())).toBe(norm(expected("div.reflection").text()));
	});
});
