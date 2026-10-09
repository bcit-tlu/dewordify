import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("knowledge-check", "fill-in-blank");

describe("knowledge-check/fill-in-blank", () => {
	it("converts the guide's Word example preserving bracket syntax", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const kc = output("div.knowledge-check");
		expect(kc.length).toBe(1);
		expect(kc.text()).toContain("[open-ended,open ended]");
		expect(kc.text()).toContain("[*dropdown, throwdown, showdown, hoedown, topdown]");
		expect(norm(kc.text())).toBe(norm(expected("div.knowledge-check").text()));
	});
});
