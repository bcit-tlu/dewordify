import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "reveal");

describe("interactions/reveal", () => {
	it("converts the guide's Word example into div.reveal matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const reveal = output("div.reveal");
		expect(reveal.length).toBe(1);
		expect(reveal.attr("data-button")).toBe("Answer");
		expect(norm(reveal.text())).toBe(norm(expected("div.reveal").text()));
		expect(reveal.text()).not.toContain("Button:");
	});
});
