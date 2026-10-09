import { describe, expect, it } from "vitest";
import { loadFragment } from "../src/core/load-html.js";
import { whitespace } from "../src/core/normalize/whitespace.js";
import { removeEmptyTags } from "../src/core/normalize/remove-empty-tags.js";
import { collectStats } from "../src/core/index.js";
import { defaultMarkoutMap } from "../src/core/index.js";
import type { ConvertContext } from "../src/core/index.js";

function makeContext(): ConvertContext {
	return { markoutMap: defaultMarkoutMap, assets: new Map(), messages: [] };
}

describe("whitespace", () => {
	it("collapses whitespace in text but not in attribute values", () => {
		const $ = loadFragment("<p class=\"a  b\" title=\"keep  this\">too   many&nbsp;spaces</p>");
		whitespace($);
		expect($("p").attr("class")).toBe("a  b");
		expect($("p").attr("title")).toBe("keep  this");
		expect($("p").text()).toBe("too many spaces");
	});

	it("collapses whitespace between elements", () => {
		const $ = loadFragment("<p>a</p>   <p>b</p>");
		whitespace($);
		expect($("temp").html()).toBe("<p>a</p> <p>b</p>");
	});
});

describe("removeEmptyTags", () => {
	it("removes parents emptied by child removal", () => {
		const $ = loadFragment("<div><p><span></span></p></div><p>real content</p>");
		removeEmptyTags($);
		expect($("temp").html()).toBe("<p>real content</p>");
	});

	it("keeps void/structural tags", () => {
		const $ = loadFragment("<p>a</p><table><tr><td></td></tr></table><br>");
		removeEmptyTags($);
		expect($("table").length).toBe(1);
		expect($("br").length).toBe(1);
	});
});

describe("stats", () => {
	it("computes words per page across pages", () => {
		const pages = [
			loadFragment("<h1>One</h1><p>alpha beta gamma</p>"),
			loadFragment("<h1>Two</h1><p>delta epsilon</p>")
		];
		const stats = collectStats(pages, makeContext());
		const pagesStat = stats.structures.find((s) => s.name === "Pages");
		expect(pagesStat?.count).toBe(2);
		expect(pagesStat?.hint).toMatch(/~\d+ words\/page/);
	});
});
