import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("learning-blocks", "quiz");

describe("learning-blocks/quiz", () => {
	it("converts the guide's Word example into div.quiz matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const block = output("div.quiz");
		expect(block.length).toBe(1);
		expect(norm(block)).toBe(norm(expected("div.quiz")));
	});
});
