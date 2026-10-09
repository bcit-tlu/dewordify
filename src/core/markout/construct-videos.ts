import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { ConvertContext } from "../types.js";
import { buildFigcaption, markoutPropertyValue } from "./helpers.js";
import { mediaType } from "./media-types.js";

/**
 * Construct video players from `figure.video` wrapper elements.
 *
 * Builds either a `<video>` element with a `<source>` (for known video
 * file extensions) or an `<iframe>` (for external links). YouTube URLs
 * are automatically converted to embed format. Extracts source and
 * license from markout properties.
 */
export function constructVideos($: CheerioAPI, ctx: ConvertContext) {
	$("figure.video").each(function () {
		let src = markoutPropertyValue($, $(this), "source", ctx) || markoutPropertyValue($, $(this), "file", ctx);
		const license = markoutPropertyValue($, $(this), "licence", ctx) || markoutPropertyValue($, $(this), "license", ctx);

		let $video: Cheerio<AnyNode> | undefined;
		const type = mediaType("video", src);

		if (type) {
			if (type === "link") {
				if (/(youtube.com|youtu.be)/.test(src)) {
					const startIndex = src.indexOf("v=");
					let youtubeId = "";
					if (startIndex === -1) {
						youtubeId = src.split("&")[0];
						youtubeId = youtubeId.substring(youtubeId.length - 11);
					} else {
						youtubeId = src.substring(startIndex + 2, startIndex + 13);
					}
					src = "https://www.youtube.com/embed/" + youtubeId;
				}
				$video = $("<iframe>").attr({ src: src, width: "560", height: "315", frameborder: "0", allowfullscreen: "" });
			} else {
				$video = $("<video controls></video>");
				const sourceSrc = /^(https?|ftp):/i.test(src) ? src : "assets/" + src;
				const $source = $("<source>").attr({ src: sourceSrc, type: type });
				$video.append($source);
			}
		}

		buildFigcaption($, $(this), license, $video);
	});
}
