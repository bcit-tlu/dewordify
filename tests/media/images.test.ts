import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("media", "images");

describe("media/images", () => {
	it("converts the guide's Word example into figure.img with alt, caption and license", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const figure = output("figure.img");
		expect(figure.length).toBe(1);
		expect(figure.find("img").attr("alt")).toBe("a photograph of a mining operation");
		expect(norm(figure.find("figcaption p").first().text())).toBe("Mining pit operations");
		expect(figure.find("figcaption footer small.license").text()).toBe("BCIT 2019");
		expect(norm(figure)).toBe(norm(expected("figure.img")));
	});
});
