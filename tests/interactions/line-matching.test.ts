import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "line-matching");

describe("interactions/line-matching", () => {
	it("converts the guide's Word example into div.line-matching with the table preserved", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const matching = output("div.line-matching");
		expect(matching.length).toBe(1);
		expect(matching.find("thead th").map((_, el) => output(el).text()).get()).toEqual(["School", "Program"]);
		expect(matching.find("tbody tr").length).toBe(6);
		expect(norm(matching.text())).toBe(norm(expected("div.line-matching").text()));
	});
});
