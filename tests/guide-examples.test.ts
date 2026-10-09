import { describe, expect, it } from "vitest";
import { loadHtml, loadFragment } from "../src/core/load-html.js";
import { markout, defaultMarkoutMap } from "../src/core/index.js";
import type { ConvertContext } from "../src/core/index.js";

function makeContext(assets = new Map<string, Uint8Array>()): ConvertContext {
	return { markoutMap: defaultMarkoutMap, assets, messages: [] };
}

function convertFragment(wordHtml: string) {
	const $page = loadFragment("<h1>Page</h1>" + wordHtml);
	markout([$page], makeContext());
	return loadHtml($page("temp").html() ?? "");
}

describe("learning blocks", () => {
	const blocks = [
		"activity", "assignment", "case", "definition", "discussion", "doing",
		"example", "group-activity", "key-point", "knowing", "link", "note",
		"outcome", "quiz", "reading", "reflection", "review", "warning"
	];

	for (const block of blocks) {
		it(`#${block} wraps content in div.${block}`, () => {
			const $ = convertFragment(`<p>#${block}</p><h2>Title</h2><p>Content here.</p><p>/${block}</p>`);
			const $block = $(`div.${block}`);
			expect($block.length).toBe(1);
			expect($block.find("h2").text()).toBe("Title");
			expect($block.find("p").text()).toBe("Content here.");
		});
	}
});

describe("text", () => {
	it("#quote nests #reference as blockquote > div.reference", () => {
		const $ = convertFragment(
			"<p>#quote</p>" +
			"<p>\"One week you'll be knee-deep in the complexities of the financial business...\"</p>" +
			"<p>#reference</p>" +
			"<p>(Hey Whipple Squeeze This! p. 16)</p>" +
			"<p>/reference</p>" +
			"<p>/quote</p>"
		);
		const $quote = $("blockquote");
		expect($quote.length).toBe(1);
		expect($quote.find("div.reference").text()).toBe("(Hey Whipple Squeeze This! p. 16)");
	});

	it("#math keeps the equation and moves the rest into figcaption", () => {
		const $ = convertFragment(
			"<p>#math</p>" +
			"<p>a <sup>2</sup> + b <sup>2</sup> = c <sup>2</sup></p>" +
			"<p>Pythagorean theorem</p>" +
			"<p>/math</p>"
		);
		const $math = $("figure.math");
		expect($math.length).toBe(1);
		expect($math.children().first().text()).toContain("a 2 + b 2 = c 2");
		expect($math.find("figcaption").text()).toBe("Pythagorean theorem");
	});
});

describe("media", () => {
	it("#image builds figure.img with alt, caption and license footer", () => {
		const $ = convertFragment(
			"<p>#image</p>" +
			"<img src=\"assets/1.jpeg\">" +
			"<p>Alt: a photograph of a mining operation</p>" +
			"<p>Mining pit operations</p>" +
			"<p>License: BCIT 2019</p>" +
			"<p>/image</p>"
		);
		const $figure = $("figure.img");
		expect($figure.length).toBe(1);
		expect($figure.find("img").attr("alt")).toBe("a photograph of a mining operation");
		expect($figure.find("figcaption p").text()).toBe("Mining pit operations");
		expect($figure.find("figcaption footer small.license").text()).toBe("BCIT 2019");
	});

	it("#audio with a file source builds audio > source", () => {
		const $ = convertFragment(
			"<p>#audio</p>" +
			"<p>Source: bird-song.mp3</p>" +
			"<p>Field recording of bird song.</p>" +
			"<p>/audio</p>"
		);
		const $figure = $("figure.audio");
		expect($figure.length).toBe(1);
		const $source = $figure.find("audio source");
		expect($source.attr("src")).toBe("assets/bird-song.mp3");
		expect($source.attr("type")).toBe("audio/mpeg");
		expect($figure.find("figcaption").text()).toBe("Field recording of bird song.");
	});

	it("#audio with a URL source builds audio > source with the URL", () => {
		const $ = convertFragment(
			"<p>#audio</p>" +
			"<p>Source: https://freesound.org/data/previews/417/417476_47392-lq.mp3</p>" +
			"<p>/audio</p>"
		);
		const $source = $("figure.audio audio source");
		expect($source.attr("src")).toBe("https://freesound.org/data/previews/417/417476_47392-lq.mp3");
		expect($source.attr("type")).toBe("audio/mpeg");
	});

	it("#video with a YouTube URL builds an embed iframe", () => {
		const $ = convertFragment(
			"<p>#video</p>" +
			"<p>Source: https://www.youtube.com/embed/fTHSmKd8OvY</p>" +
			"<p>BCIT Burnaby Campus in 30 Seconds</p>" +
			"<p>License: BCIT 2019</p>" +
			"<p>/video</p>"
		);
		const $figure = $("figure.video");
		expect($figure.find("iframe").attr("src")).toBe("https://www.youtube.com/embed/fTHSmKd8OvY");
		expect($figure.find("iframe").attr("width")).toBe("560");
		expect($figure.find("iframe").attr("height")).toBe("315");
		expect($figure.find("figcaption footer small.license").text()).toBe("BCIT 2019");
	});

	it("#video with a file source builds video > source", () => {
		const $ = convertFragment(
			"<p>#video</p>" +
			"<p>Source: moraine-lake-time-lapse.mp4</p>" +
			"<p>/video</p>"
		);
		const $source = $("figure.video video source");
		expect($source.attr("src")).toBe("assets/moraine-lake-time-lapse.mp4");
		expect($source.attr("type")).toBe("video/mp4");
	});
});

describe("tables", () => {
	it("#table builds figure.table with caption, thead and license figcaption", () => {
		const $ = convertFragment(
			"<p>#table</p>" +
			"<h2>Table 1: Table heading</h2>" +
			"<table><tr><td><strong>Heading 1</strong></td><td><strong>Heading 2</strong></td></tr>" +
			"<tr><td>Cell 1</td><td>Cell 2</td></tr></table>" +
			"<p>Table caption text</p>" +
			"<p>License: BCIT 2025</p>" +
			"<p>/table</p>"
		);
		const $figure = $("figure.table");
		expect($figure.length).toBe(1);
		expect($figure.find("table caption").text()).toBe("Table 1: Table heading");
		expect($figure.find("thead th").length).toBe(2);
		expect($figure.find("tbody td").length).toBe(2);
		expect($figure.find("figcaption p").text()).toBe("Table caption text");
		expect($figure.find("figcaption footer small.license").text()).toBe("BCIT 2025");
	});
});

describe("interactions", () => {
	it("#reveal applies the Button property and keeps content", () => {
		const $ = convertFragment(
			"<p>#reveal</p>" +
			"<p>Button: Answer</p>" +
			"<p>The CHN needs a good working knowledge of...</p>" +
			"<p>/reveal</p>"
		);
		const $reveal = $("div.reveal");
		expect($reveal.length).toBe(1);
		expect($reveal.attr("data-button")).toBe("Answer");
		expect($reveal.text()).toContain("The CHN needs a good working knowledge of");
		expect($reveal.text()).not.toContain("Button:");
	});

	it("#reveal applies active-reveal properties", () => {
		const $ = convertFragment(
			"<p>#reveal</p>" +
			"<p>Button: Check</p>" +
			"<p>Min-text: 90</p>" +
			"<p>Placeholder: Type your answer here</p>" +
			"<p>Rows: 4</p>" +
			"<p>Answer content</p>" +
			"<p>/reveal</p>"
		);
		const $reveal = $("div.reveal");
		expect($reveal.attr("data-button")).toBe("Check");
		expect($reveal.attr("data-min-text")).toBe("90");
		expect($reveal.attr("data-placeholder")).toBe("Type your answer here");
		expect($reveal.attr("data-rows")).toBe("4");
	});

	it("#accordion wraps panels in div.accordion", () => {
		const $ = convertFragment(
			"<p>#accordion</p>" +
			"<h2>Tolerance Levels</h2>" +
			"<p>The human body has tolerance levels...</p>" +
			"<h2>Multiple Kinds of Energy</h2>" +
			"<p>The interaction of two or more kinds of energy...</p>" +
			"<p>/accordion</p>"
		);
		const $accordion = $("div.accordion");
		expect($accordion.length).toBe(1);
		expect($accordion.children("h2").length).toBe(2);
		expect($accordion.children("h2").first().text()).toBe("Tolerance Levels");
	});

	it("#tabs wraps content in div.tabs and preserves tab-text for runtime parsing", () => {
		const $ = convertFragment(
			"<p>#tabs</p>" +
			"<h2>Northwest Territories</h2>" +
			"<p>tab-text: Northwest</p>" +
			"<ul><li>Capital: Yellowknife</li></ul>" +
			"<h2>Yukon</h2>" +
			"<ul><li>Capital: Whitehorse</li></ul>" +
			"<p>/tabs</p>"
		);
		const $tabs = $("div.tabs");
		expect($tabs.length).toBe(1);
		expect($tabs.children("h2").length).toBe(2);
		expect($tabs.text()).toContain("tab-text: Northwest");
	});

	it("#flashcards builds table.flashcards and preserves thead", () => {
		const $ = convertFragment(
			"<p>#flashcards</p>" +
			"<table><thead><tr><th>Front</th><th>Back</th></tr></thead>" +
			"<tbody><tr><td>What is the capital of Canada?</td><td>Ottawa</td></tr></tbody></table>" +
			"<p>/flashcards</p>"
		);
		const $table = $("table.flashcards");
		expect($table.length).toBe(1);
		expect($table.find("thead th").first().text()).toBe("Front");
		expect($table.find("tbody td").first().text()).toBe("What is the capital of Canada?");
		expect($("figure.flashcards").length).toBe(0);
	});

	it("#interaction applies default 560x315 dimensions to iframes without them", () => {
		const $ = convertFragment(
			"<p>#interaction</p>" +
			"<p>&lt;iframe src=\"https://example.com/embed\"&gt;&lt;/iframe&gt;</p>" +
			"<p>/interaction</p>"
		);
		const $iframe = $("iframe");
		expect($iframe.attr("src")).toBe("https://example.com/embed");
		expect($iframe.attr("width")).toBe("560");
		expect($iframe.attr("height")).toBe("315");
	});

	it("#interaction keeps embed-provided dimensions", () => {
		const $ = convertFragment(
			"<p>#interaction</p>" +
			"<p>&lt;iframe src=\"https://example.com/embed\" width=\"800\" height=\"600\"&gt;&lt;/iframe&gt;</p>" +
			"<p>/interaction</p>"
		);
		const $iframe = $("iframe");
		expect($iframe.attr("width")).toBe("800");
		expect($iframe.attr("height")).toBe("600");
	});

	it("#slider groups h2+img+caption sequences into figure.img slides", () => {
		const $ = convertFragment(
			"<p>#slider</p>" +
			"<h2>Damaged Log</h2>" +
			"<img src=\"assets/1.jpg\" alt=\"Damaged Log\">" +
			"<p>Log damaged in the log yard.</p>" +
			"<h2>Lumber Yard</h2>" +
			"<img src=\"assets/2.jpg\" alt=\"Lumber yard\">" +
			"<p>The purpose of a log yard is to store logs.</p>" +
			"<p>/slider</p>"
		);
		const $slider = $("div.slider");
		expect($slider.length).toBe(1);
		const $slides = $slider.children("figure.img");
		expect($slides.length).toBe(2);
		expect($slides.first().find("h2").text()).toBe("Damaged Log");
		expect($slides.first().find("img").attr("alt")).toBe("Damaged Log");
		expect($slides.first().find("figcaption").text()).toContain("Log damaged in the log yard.");
	});

	it("#slider inserts placeholder img for h2 without a following img", () => {
		const $ = convertFragment(
			"<p>#slider</p>" +
			"<h2>Damaged Log</h2>" +
			"<p>Log damaged in the log yard.</p>" +
			"<p>More notes about the log.</p>" +
			"<h2>Lumber Yard</h2>" +
			"<p>The purpose of a log yard is to store logs.</p>" +
			"<p>/slider</p>"
		);
		const $slides = $("div.slider").children("figure.img");
		expect($slides.length).toBe(2);
		// First slide keeps its h2, both following paragraphs, and a placeholder img.
		const $first = $slides.first();
		expect($first.find("h2").text()).toBe("Damaged Log");
		expect($first.find("img").length).toBe(1);
		expect($first.find("figcaption").text()).toContain("Log damaged in the log yard.");
		expect($first.find("figcaption").text()).toContain("More notes about the log.");
		// Second slide keeps its h2, its paragraph, and a placeholder img.
		const $second = $slides.last();
		expect($second.find("h2").text()).toBe("Lumber Yard");
		expect($second.find("img").length).toBe(1);
		expect($second.find("figcaption").text()).toContain("store logs.");
	});
});

describe("knowledge checks", () => {
	it("#knowledge-check wraps questions and preserves markers for runtime", () => {
		const $ = convertFragment(
			"<p>#knowledge-check</p>" +
			"<ul><li>" +
			"<p>When was BCIT's 50<sup>th</sup> anniversary celebration?</p>" +
			"<ul><li>1967</li><li>1987</li><li>2016</li><li>*2017</li></ul>" +
			"</li><li>" +
			"<p>True or false: the BCIT logo is square.</p>" +
			"<p>@ The old BCIT logo was stylized text in an ellipse.</p>" +
			"<ul><li>*True</li><li>False</li></ul>" +
			"</li></ul>" +
			"<p>/knowledge-check</p>"
		);
		const $kc = $("div.knowledge-check");
		expect($kc.length).toBe(1);
		expect($kc.find("> ul > li").length).toBe(2);
		expect($kc.text()).toContain("*2017");
		expect($kc.text()).toContain("@ The old BCIT logo was stylized text");
	});

	it("#knowledge-check preserves fill-in-the-blank bracket syntax", () => {
		const $ = convertFragment(
			"<p>#knowledge-check</p>" +
			"<ol><li><p>Two varieties, [open-ended,open ended] and [*dropdown, throwdown] lists.</p></li></ol>" +
			"<p>/knowledge-check</p>"
		);
		const $kc = $("div.knowledge-check");
		expect($kc.text()).toContain("[open-ended,open ended]");
		expect($kc.text()).toContain("[*dropdown, throwdown]");
	});

	it("#knowledge-check preserves matching pairs", () => {
		const $ = convertFragment(
			"<p>#knowledge-check</p>" +
			"<ol><li>" +
			"<p>Match the following things to their colour:</p>" +
			"<ul><li>Green = Leaf</li><li>Red = Tomato</li></ul>" +
			"</li></ol>" +
			"<p>/knowledge-check</p>"
		);
		const $kc = $("div.knowledge-check");
		expect($kc.text()).toContain("Green = Leaf");
		expect($kc.text()).toContain("Red = Tomato");
	});

	it("#knowledge-check can nest inside #quiz", () => {
		const $ = convertFragment(
			"<p>#quiz</p>" +
			"<p>#knowledge-check</p>" +
			"<ol><li><p>Question?</p><ul><li>*Yes</li><li>No</li></ul></li></ol>" +
			"<p>/knowledge-check</p>" +
			"<p>/quiz</p>"
		);
		expect($("div.quiz div.knowledge-check").length).toBe(1);
	});
});
