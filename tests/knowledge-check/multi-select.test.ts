import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("knowledge-check", "multi-select");

describe("knowledge-check/multi-select", () => {
	it("converts the guide's Word example preserving ordered options and correct markers", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const kc = output("div.knowledge-check");
		expect(kc.length).toBe(1);
		expect(kc.find("ol ol li").length).toBe(5);
		expect(kc.text()).toContain("*3D Modelling");
		expect(kc.find("a").attr("href")).toBe("https://www.bcit.ca/learning-teaching-centre/services/");
		expect(norm(kc.text())).toBe(norm(expected("div.knowledge-check").text()));
	});
});
