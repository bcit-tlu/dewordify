import type { CheerioAPI } from "cheerio";
import type { ConvertContext } from "../types.js";
import { buildFigcaption, isCellEmpty, isCellHeader, markoutPropertyValue, renameElement } from "./helpers.js";

function normalizeAndParseTables($: CheerioAPI) {
	$("table").each(function () {
		if ($(this).parents("figure.flashcards").length) return;

		const $tbody = $("<tbody>");
		$(this).find("tr").each(function () {
			if ($(this).parents("thead").length === 0) {
				$(this).appendTo($tbody);
			}
		});
		$(this).append($tbody);

		$("td").each(function () {
			const $children = $(this).find("p,ol,ul");
			if ($children.length === 1) {
				const $p = $(this).find("p");
				$p.replaceWith($p.html() ?? "");
			}
		});

		const $firstCell = $(this).find("tr:first-child td:first-child");
		const $colHeaders = $(this).find("tr:first-child td:nth-of-type(n + 2)");
		const $rowHeaders = $(this).find("tr:nth-of-type(n + 2) td:first-child");

		let colHeaders = false;
		let rowHeaders = false;

		const firstCellHeader = isCellEmpty($, $firstCell) || isCellHeader($, $firstCell);

		if (firstCellHeader) {
			$colHeaders.each(function () {
				if (!isCellHeader($, $(this))) {
					colHeaders = false;
					return false;
				}
				colHeaders = true;
				return true;
			});

			$rowHeaders.each(function () {
				if (!isCellHeader($, $(this))) {
					rowHeaders = false;
					return false;
				}
				rowHeaders = true;
				return true;
			});
		}

		if (colHeaders) {
			let $firstRow = $(this).find("tr:first-child td");
			const $thead = $("<thead>");

			$firstRow.each(function () {
				$(this).find("strong").each(function () {
					$(this).replaceWith($(this).html() ?? "");
				});
				renameElement(this, "th");
			});
			$firstRow = $(this).find("tr:first-child th");

			$firstRow.first().each(function () {
				if (isCellEmpty($, $(this))) {
					renameElement(this, "td");
				}
			});

			$(this).find("tbody").before($thead);
			$thead.append($("<tr>").append($firstRow));
			$(this).find("tbody tr:first-child").remove();
		}

		if (rowHeaders) {
			const $firstCol = $(this).find("tbody td:first-child");
			$firstCol.each(function () {
				$(this).find("strong").each(function () {
					$(this).replaceWith($(this).html() ?? "");
				});
				renameElement(this, "th");
			});
		}
	});
}

function constructAndFinishTables($: CheerioAPI, ctx: ConvertContext) {
	$("figure.table").each(function () {
		let title = markoutPropertyValue($, $(this), "title", ctx);
		const license = markoutPropertyValue($, $(this), "licence", ctx) || markoutPropertyValue($, $(this), "license", ctx);

		if (!title.length) {
			const $title = $(this).children("h1,h2,h3,h4,h5,h6").first();
			title = $title.text();
			$title.remove();
		}

		const $table = $(this).find("table").clone();
		$(this).find("table").remove();

		if (title.length) {
			$table.prepend("<caption>" + title + "</caption>");
		}

		buildFigcaption($, $(this), license, $table);
	});

	$("table").each(function () {
		if ($(this).parents("figure.table").length === 0 && $(this).parents("figure.flashcards").length === 0) {
			$(this).wrap(ctx.markoutMap.wrappers.table);
		}
	});

	$("table").each(function () {
		if ($(this).parents("figure.flashcards").length) return;
		const hasThead = $(this).find("thead").length > 0;
		const hasTh = $(this).find("th").length > 0;
		if (!hasTh && !hasThead) {
			const $thead = $("<thead>");
			const $firstRow = $(this).find("tbody tr:first-child");
			$firstRow.find("td").each(function () {
				renameElement(this, "th");
			});
			$thead.append($firstRow);
			$(this).find("tbody").before($thead);
		}
	});
}

/**
 * Process all tables in two passes:
 * 1. Normalize structure (ensure `<tbody>`, parse header rows/columns)
 * 2. Construct figures (extract titles, wrap unmarked tables, ensure thead)
 */
export function tables($: CheerioAPI, ctx: ConvertContext) {
	normalizeAndParseTables($);
	constructAndFinishTables($, ctx);
}
