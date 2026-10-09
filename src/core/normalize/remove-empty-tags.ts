import type { CheerioAPI } from "cheerio";

/**
 * Remove empty elements (those containing only whitespace or nothing).
 * Preserves elements that are meaningful even when empty (a, img, td, th, tr, br, hr).
 * Iterates until no more empty tags are found, since removing one empty tag
 * may leave its parent empty.
 */
export function removeEmptyTags($: CheerioAPI) {
	const preserve = "a,img,td,th,tr,br,hr";
	let removed = true;
	while (removed) {
		removed = false;
		$("*:not(" + preserve + ")").each(function () {
			const contents = $(this).html();
			if (contents === "" || contents === " ") {
				$(this).remove();
				removed = true;
			}
		});
	}
}
