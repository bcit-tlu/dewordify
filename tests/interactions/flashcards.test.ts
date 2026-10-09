import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "flashcards");

describe("interactions/flashcards", () => {
	it("converts the guide's Word example into table.flashcards matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const table = output("table.flashcards");
		expect(table.length).toBe(1);
		expect(output("figure.flashcards").length).toBe(0);
		expect(table.find("thead th").map((_, el) => output(el).text()).get()).toEqual(["Front", "Back"]);
		expect(table.find("tbody tr").length).toBe(3);
		expect(norm(table.text())).toBe(norm(expected("table.flashcards").text()));
	});
});
