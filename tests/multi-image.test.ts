import { describe, expect, it } from "vitest";
import { loadFragment } from "../src/core/load-html.js";
import { markout, defaultMarkoutMap } from "../src/core/index.js";
import type { ConvertContext } from "../src/core/index.js";

function makeContext(assets = new Map<string, Uint8Array>()): ConvertContext {
	return { markoutMap: defaultMarkoutMap, assets, messages: [] };
}

describe("multiple #image blocks", () => {
	it("handles three consecutive #image blocks without false positive", () => {
		const ctx = makeContext();
		const $page = loadFragment(
			"<h1>Page</h1>" +
			'<p>#image</p><img src="a.jpg"><p>/image</p>' +
			'<p>#image</p><img src="b.jpg"><p>/image</p>' +
			'<p>#image</p><img src="c.jpg"><p>/image</p>'
		);
		markout([$page], ctx);
		const figures = $page("figure.img");
		console.log("Messages:", JSON.stringify(ctx.messages));
		console.log("Figure count:", figures.length);
		figures.each((i, el) => {
			console.log(`Figure ${i}: ${$page(el).find("img").length} image(s)`);
		});
		expect(ctx.messages.filter(m => m.text.includes("Multiple images"))).toHaveLength(0);
	});

	it("handles #image blocks with images inside p tags", () => {
		const ctx = makeContext();
		const $page = loadFragment(
			"<h1>Page</h1>" +
			'<p>#image</p><p><img src="a.jpg"></p><p>/image</p>' +
			'<p>#image</p><p><img src="b.jpg"></p><p>/image</p>' +
			'<p>#image</p><p><img src="c.jpg"></p><p>/image</p>'
		);
		markout([$page], ctx);
		const figures = $page("figure.img");
		console.log("Messages:", JSON.stringify(ctx.messages));
		console.log("Figure count:", figures.length);
		figures.each((i, el) => {
			console.log(`Figure ${i}: ${$page(el).find("img").length} image(s)`);
		});
		expect(ctx.messages.filter(m => m.text.includes("Multiple images"))).toHaveLength(0);
	});

	it("handles #image blocks with alt text", () => {
		const ctx = makeContext();
		const $page = loadFragment(
			"<h1>Page</h1>" +
			'<p>#image</p><p><img src="a.jpg"></p><p>Alt: first</p><p>/image</p>' +
			'<p>#image</p><p><img src="b.jpg"></p><p>Alt: second</p><p>/image</p>' +
			'<p>#image</p><p><img src="c.jpg"></p><p>Alt: third</p><p>/image</p>'
		);
		markout([$page], ctx);
		const figures = $page("figure.img");
		console.log("Messages:", JSON.stringify(ctx.messages));
		console.log("Figure count:", figures.length);
		figures.each((i, el) => {
			console.log(`Figure ${i}: ${$page(el).find("img").length} image(s)`);
		});
		expect(ctx.messages.filter(m => m.text.includes("Multiple images"))).toHaveLength(0);
	});

	it("handles #image blocks with other markers in between", () => {
		const ctx = makeContext();
		const $page = loadFragment(
			"<h1>Page</h1>" +
			'<p>#image</p><p><img src="a.jpg"></p><p>Alt: first</p><p>/image</p>' +
			'<p>Some text between images</p>' +
			'<p>#image</p><p><img src="b.jpg"></p><p>Alt: second</p><p>/image</p>' +
			'<p>More text</p>' +
			'<p>#image</p><p><img src="c.jpg"></p><p>Alt: third</p><p>/image</p>'
		);
		markout([$page], ctx);
		const figures = $page("figure.img");
		console.log("Messages:", JSON.stringify(ctx.messages));
		console.log("Figure count:", figures.length);
		figures.each((i, el) => {
			console.log(`Figure ${i}: ${$page(el).find("img").length} image(s)`);
		});
		expect(ctx.messages.filter(m => m.text.includes("Multiple images"))).toHaveLength(0);
	});

	it("handles #image blocks with source property", () => {
		const ctx = makeContext();
		const $page = loadFragment(
			"<h1>Page</h1>" +
			'<p>#image</p><p><img src="a.jpg"></p><p>Source: a-full.jpg</p><p>Alt: first</p><p>/image</p>' +
			'<p>#image</p><p><img src="b.jpg"></p><p>Source: b-full.jpg</p><p>Alt: second</p><p>/image</p>' +
			'<p>#image</p><p><img src="c.jpg"></p><p>Source: c-full.jpg</p><p>Alt: third</p><p>/image</p>'
		);
		markout([$page], ctx);
		const figures = $page("figure.img");
		console.log("Messages:", JSON.stringify(ctx.messages));
		console.log("Figure count:", figures.length);
		figures.each((i, el) => {
			console.log(`Figure ${i}: ${$page(el).find("img").length} image(s)`);
		});
		expect(ctx.messages.filter(m => m.text.includes("Multiple images"))).toHaveLength(0);
	});

});
