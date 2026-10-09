import { describe, expect, it } from "vitest";
import { loadHtml } from "../../src/core/load-html.js";
import { convertWord, guideExample, norm } from "../helpers/guide.js";

const { word, preview } = guideExample("media", "videos");

describe("media/videos", () => {
	it("converts the guide's embedded YouTube example into figure.video with an iframe", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const figures = output("figure.video");
		expect(figures.length).toBe(2);

		const embedded = figures.first();
		expect(embedded.find("iframe").attr("src")).toBe("https://www.youtube.com/embed/fTHSmKd8OvY");
		expect(embedded.find("iframe").attr("width")).toBe("560");
		expect(embedded.find("iframe").attr("height")).toBe("315");
		expect(embedded.find("figcaption footer small.license").text()).toBe("BCIT 2019");
		expect(norm(embedded)).toBe(norm(expected("figure.video").first()));
	});

	it("converts the guide's video file example into figure.video with a video element", () => {
		const output = convertWord(word);
		const expected = loadHtml(preview);

		const file = output("figure.video").last();
		const source = file.find("video source");
		expect(source.attr("src")).toBe("assets/moraine-lake-time-lapse.mp4");
		expect(source.attr("type")).toBe("video/mp4");
		expect(file.find("figcaption footer small.license").text()).toContain("Rain MeditateHub");
		expect(norm(file)).toBe(norm(expected("figure.video").last()));
	});
});
