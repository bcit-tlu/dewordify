import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { ConvertContext } from "../types.js";
import { buildFigcaption, markoutPropertyValue } from "./helpers.js";
import { mediaType } from "./media-types.js";

/**
 * Construct audio players from `figure.audio` wrapper elements.
 *
 * Builds either an `<audio>` element with a `<source>` (for known audio
 * file extensions) or an `<iframe>` (for external links like SoundCloud).
 * Extracts source and license from markout properties.
 */
export function constructAudio($: CheerioAPI, ctx: ConvertContext) {
	$("figure.audio").each(function () {
		const src = markoutPropertyValue($, $(this), "source", ctx) || markoutPropertyValue($, $(this), "file", ctx);
		const license = markoutPropertyValue($, $(this), "licence", ctx) || markoutPropertyValue($, $(this), "license", ctx);

		let $audio: Cheerio<AnyNode> | undefined;
		const type = mediaType("audio", src);

		if (type === "link") {
			$audio = $("<iframe>").attr({ src: src, frameborder: "0", allowfullscreen: "" });
		} else if (type) {
			$audio = $("<audio controls></audio>");
			const sourceSrc = /^(https?|ftp):/i.test(src) ? src : "assets/" + src;
			const $source = $("<source>").attr({ src: sourceSrc, type: type });
			$audio.append($source);
		}

		buildFigcaption($, $(this), license, $audio);
	});
}
