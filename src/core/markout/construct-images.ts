import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import type { ConvertContext } from "../types.js";
import { buildFigcaption, markoutPropertyValue } from "./helpers.js";

const previewImageTag = "_dewordify_";

/**
 * Construct image figures from `figure.img` wrapper elements.
 *
 * Extracts title, alt text, source, and license from markout properties.
 * Handles the preview image workflow: when a `source:` property references
 * a different file than the embedded image, the embedded image is renamed
 * to a `_dewordify_` prefixed asset and marked with a `preview` class.
 */
export function constructImages($: CheerioAPI, ctx: ConvertContext) {
	$("p img").each(function () {
		const $p = $(this).closest("p");
		const $img = $p.find("img");
		$p.before($img.clone());
		$img.remove();
		if ($p.text().trim() === "") {
			$p.remove();
		}
	});

	$("figure.img").each(function () {
		const title = markoutPropertyValue($, $(this), "title", ctx);
		const alt = markoutPropertyValue($, $(this), "alt", ctx);
		const src = markoutPropertyValue($, $(this), "source", ctx) || markoutPropertyValue($, $(this), "file", ctx);
		const license = markoutPropertyValue($, $(this), "licence", ctx) || markoutPropertyValue($, $(this), "license", ctx);

		let $image: Cheerio<Element> = $(this).find("img");
		if ($image.length === 0) {
			$image = $("<img/>") as unknown as Cheerio<Element>;
		}
		if ($image.length > 1) {
			ctx.messages.push({
				level: "error",
				source: "markout",
				text: `Multiple images embedded inside #image. See: ${ctx.pageFilename}`
			});
			const temp = $image.first().clone();
			$image.remove();
			$image = temp;
		}
		const $img = $image.clone();
		$image.remove();

		if (alt) {
			$img.attr("alt", alt);
		}
		if (src.length > 3) {
			if (!ctx.assets.has(src) && $img.attr("src")) {
				const previewImageName = previewImageTag + src;
				const oldSrc = ($img.attr("src") ?? "").replace(/^assets\//, "");
				const data = ctx.assets.get(oldSrc);
				if (data !== undefined) {
					ctx.assets.delete(oldSrc);
					ctx.assets.set(previewImageName, data);
				}
				$img.addClass("preview");
				$img.attr("src", "assets/" + previewImageName);
			} else {
				if (/^((http|https|ftp):)/.test(src)) {
					$img.attr("src", src);
				} else {
					$img.attr("src", "assets/" + src);
				}
			}
		}
		buildFigcaption($, $(this), license, $img);

		if (title) {
			const $title = $("<h2>").text(title);
			$(this).prepend($title);
		}
	});

	$("img").each(function () {
		if ($(this).parents("figure.img").length === 0) {
			$(this).wrap(ctx.markoutMap.wrappers.image);
		}
	});
}
