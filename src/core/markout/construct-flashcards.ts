import type { CheerioAPI } from "cheerio";

/**
 * Construct flashcard interactions by unwrapping `figure.flashcards`
 * elements and promoting their inner table to a `table.flashcards`.
 */
export function constructFlashcards($: CheerioAPI) {
	$("figure.flashcards").each(function () {
		$(this).find("table").addClass("flashcards");
		$(this).replaceWith($(this).children());
	});
}
