import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("media", "audio");

describe("media/audio", () => {
	it("converts the guide's Word example into figure.audio with an audio element for mp3 URLs", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const figure = output("figure.audio");
		expect(figure.length).toBe(1);
		const source = figure.find("audio source");
		expect(source.attr("src")).toBe("https://freesound.org/data/previews/417/417476_47392-lq.mp3");
		expect(source.attr("type")).toBe("audio/mpeg");
		expect(figure.find("figcaption footer small.license").length).toBe(1);
		expect(norm(figure)).toBe(norm(expected("figure.audio")));
	});
});
