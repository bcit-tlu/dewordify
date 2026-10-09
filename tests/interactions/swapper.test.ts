import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("interactions", "swapper");

describe("interactions/swapper", () => {
	it("converts the guide's Word example into div.swapper with nested blocks intact", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const swapper = output("div.swapper");
		expect(swapper.length).toBe(1);
		expect(swapper.find("div.activity").length).toBe(1);
		expect(swapper.find("figure.img").length).toBe(2);
		expect(swapper.find("figure.video iframe").attr("src")).toBe("https://www.youtube.com/embed/lOT0GOyw2pY");
		expect(swapper.find("figure.img img").first().attr("alt")).toBe("a photograph of a mining operation");
		expect(norm(swapper)).toBe(norm(expected("div.swapper")));
	});
});
