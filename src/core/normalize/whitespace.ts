import type { CheerioAPI } from "cheerio";
import type { AnyNode, Text } from "domhandler";

/**
 * Normalize whitespace in text nodes by replacing non-breaking spaces
 * with regular spaces and collapsing runs of whitespace into single spaces.
 */
export function whitespace($: CheerioAPI) {
	walk($.root()[0], function (node) {
		node.data = node.data
			.replace(/&nbsp;/g, " ")
			.replace(/\u00a0/g, " ")
			.replace(/\s{2,}/g, " ");
	});
}

/** Recursively traverse the DOM tree, calling `fn` on each text node. */
function walk(node: AnyNode | undefined, fn: (text: Text) => void) {
	if (!node) return;
	if (node.type === "text") {
		fn(node as Text);
		return;
	}
	const children = (node as { children?: AnyNode[] }).children;
	if (Array.isArray(children)) {
		for (const child of children) {
			walk(child, fn);
		}
	}
}
