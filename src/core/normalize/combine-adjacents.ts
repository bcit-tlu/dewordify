import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";

function tagNameOf(node: AnyNode | undefined): string | undefined {
	if (!node) return undefined;
	return (node as Element).name;
}

function textValueOf(node: AnyNode | undefined): string | undefined {
	if (!node) return undefined;
	const n = node as unknown as { data?: string; nodeValue?: string };
	return n.data ?? n.nodeValue;
}

function isNextTagSameName($thisTag: Cheerio<Element>) {
	const $nextTag = $thisTag.next();
	const thisTagName = tagNameOf($thisTag[0]);
	if ($nextTag.length) {
		const nextTagName = tagNameOf($nextTag[0]);
		if (thisTagName === nextTagName) {
			return true;
		}
	}
	return false;
}

function isImmediatelyAdjacent($thisTag: Cheerio<Element>) {
	const thisTagName = tagNameOf($thisTag[0]);
	const nextTagName = tagNameOf(($thisTag[0] as Element).next ?? undefined);
	if (thisTagName === nextTagName) {
		return true;
	}
	return false;
}

function isNextToSpace($thisTag: Cheerio<Element>) {
	const value = textValueOf(($thisTag[0] as Element).next ?? undefined);
	return value === " ";
}

function shouldCombineAdjacent($thisTag: Cheerio<Element>) {
	if (isNextTagSameName($thisTag)) {
		if (isImmediatelyAdjacent($thisTag)) {
			return true;
		}
		if (isNextToSpace($thisTag)) {
			return true;
		}
	}
	return false;
}

function combineAdjacents($: CheerioAPI, tag: string) {
	const $tags = $(tag);

	for (let i = 0; i < $tags.length; i++) {
		const $thisTag = $tags.eq(i) as Cheerio<Element>;

		while (shouldCombineAdjacent($thisTag)) {
			i++;
			let html = $thisTag.html() ?? "";
			const $next = $thisTag.next();

			if (isNextToSpace($thisTag)) {
				html += " ";
				$(($thisTag[0] as Element).next as AnyNode).remove();
			}

			html += $next.html() ?? "";
			$next.remove();

			$thisTag.html(html);
		}
	}
}

/**
 * Combine adjacent inline formatting tags of the same type.
 *
 * Word often splits formatting across multiple identical tags (e.g.,
 * `<em>hello</em> <em>world</em>`). This merges them into single elements.
 * Tags separated by only a space are also combined, preserving the space.
 */
export function combineAdjacentTags($: CheerioAPI) {
	const tagTypes = ["em", "strong"];
	for (const tag of tagTypes) {
		combineAdjacents($, tag);
	}
}
