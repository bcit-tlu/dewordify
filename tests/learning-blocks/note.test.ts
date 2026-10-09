import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "note");

describe("learning-blocks/note", () => {
	it("converts the guide's Word example into div.note matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.note");
		expect(block.length).toBe(1);
		expect(norm(block.text())).toBe(norm(expected("div.note").text()));
	});
});
