import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "checklist");

describe("interactions/checklist", () => {
	it("converts the guide's Word example into div.checklist with a nested quiz block", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const checklist = output("div.checklist");
		expect(checklist.length).toBe(1);
		expect(checklist.find("> ul > li").length).toBe(2);
		expect(checklist.find("div.quiz").length).toBe(1);
		expect(norm(checklist.text())).toBe(norm(expected("div.checklist").text()));
	});
});
