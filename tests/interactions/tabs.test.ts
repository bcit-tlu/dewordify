import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "tabs");

describe("interactions/tabs", () => {
	it("converts the guide's Word example into div.tabs matching the documented HTML", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const tabs = output("div.tabs");
		expect(tabs.length).toBe(1);
		expect(tabs.children("h2").length).toBe(3);
		// tab-text is parsed by sugar-suite at runtime and must survive conversion
		expect(tabs.text()).toContain("tab-text: Northwest");
		expect(norm(tabs)).toBe(norm(expected("div.tabs")));
	});
});
