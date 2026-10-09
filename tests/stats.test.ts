import { describe, expect, it } from "vitest";
import { loadFragment } from "../src/core/load-html.js";
import { markout, defaultMarkoutMap, collectStats } from "../src/core/index.js";
import type { ConvertContext } from "../src/core/index.js";

function makeContext(): ConvertContext {
	return { markoutMap: defaultMarkoutMap, assets: new Map<string, Uint8Array>(), messages: [] };
}

function convertFragment(wordHtml: string) {
	const ctx = makeContext();
	const $page = loadFragment("<h1>Page</h1>" + wordHtml);
	markout([$page], ctx);
	const stats = collectStats([$page], ctx);
	return { $: $page, ctx, stats };
}

describe("collectStats", () => {
	it("reports the page count even when the document has no H1", () => {
		const ctx = makeContext();
		const $page = loadFragment("<p>No heading here.</p>");
		markout([$page], ctx);
		const stats = collectStats([$page], ctx);
		const pages = stats.structures.find((s) => s.name === "Pages");
		expect(pages?.count).toBe(1);
	});

	it("counts interaction embeds under Learning Blocks", () => {
		const { stats } = convertFragment(
			"<p>#interaction</p>" +
			"<p>&lt;iframe src=\"https://example.com/embed\"&gt;&lt;/iframe&gt;</p>" +
			"<p>/interaction</p>"
		);
		const interaction = stats.learningBlocks.find((m) => m.name === "#interaction");
		expect(interaction?.count).toBe(1);
	});

	it("does not count video embeds as interactions", () => {
		const { stats } = convertFragment(
			"<p>#video</p>" +
			"<p>Source: https://www.youtube.com/watch?v=abc12345678</p>" +
			"<p>/video</p>"
		);
		expect(stats.learningBlocks.some((m) => m.name === "#interaction")).toBe(false);
	});
});
