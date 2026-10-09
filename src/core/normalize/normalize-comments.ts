import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

/**
 * Convert Word comment references and definitions into HTML comments.
 *
 * Mammoth generates `<a>` elements linking to comment definitions in a
 * `<dl>` element. This replaces those with `<!--NOTE: ... -->` HTML
 * comments and removes the original mammoth markup.
 */
export function normalizeComments($: CheerioAPI) {
	$("[href*=comment-ref-]").remove();

	$($(".word-comment").get().reverse()).each(function () {
		replaceMammothComments.call(this as Element, $);
	});

	$(".word-comment").remove();
	$("[id*='comment-']").parent("dl").remove();
}

function replaceMammothComments(this: Element, $: CheerioAPI) {
	const $parent = $(this).parent();
	const $subComments = $(this).children("a");

	const comment = formatComment($, $subComments);

	if (comment.length) {
		$parent.prepend(comment);
	}
}

function formatComment($: CheerioAPI, $subComments: Cheerio<Element>) {
	const comments: string[] = [];

	$subComments.each(function () {
		const href = $(this).attr("href") ?? "";
		const commentID = href.slice(href.indexOf("#") + 1);
		const $commentLabel = $("[id*='" + commentID + "']");
		const $commentText = $commentLabel.next();
		const commentLabel = formatCommentLabel($(this).text());
		const commentText = formatCommentText($commentText.text());

		if (commentText.length) {
			comments.push(commentLabel + ":\t" + commentText);
		}
	});
	if (comments.length) {
		return "<!--NOTE:\n" + comments.join("\n\n") + "\n-->";
	}
	return "";
}

function formatCommentLabel(string: string) {
	return string.replace(/[^a-zA-Z]/g, "");
}

function formatCommentText(string: string) {
	let commentText = string.trim();
	const sentenceBreaks = commentText.match(/([a-z]|\.|!|\?)[A-Z]/g);
	if (sentenceBreaks) {
		sentenceBreaks.forEach(function (sentenceBreak) {
			const newBreak = sentenceBreak.split("").join("\n\t\t");
			commentText = commentText.replace(sentenceBreak, newBreak).trim();
		});
	}
	return commentText;
}
