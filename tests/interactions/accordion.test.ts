import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "accordion");

describe("interactions/accordion", () => {
	it("converts the guide's Word example into div.accordion matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const accordion = output("div.accordion").first();
		expect(accordion.length).toBe(1);
		expect(accordion.children("h2").length).toBe(2);
		expect(norm(accordion)).toBe(norm(expected("div.accordion").first()));
	});
});
