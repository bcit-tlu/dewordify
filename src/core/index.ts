import { defaultMarkoutMap, defaultStyleMap, defaultTemplate } from "./defaults.js";
import { loadFragment } from "./load-html.js";
import { normalize } from "./normalize/index.js";
import { paginate } from "./paginate.js";
import { markout } from "./markout/index.js";
import { collectStats } from "./stats.js";
import { generatePages } from "./pages.js";
import { extensionOf } from "./filenames.js";
import type { ConvertContext, ConvertOptions, ConvertResult, OutputFile } from "./types.js";

export * from "./types.js";
export { defaultMarkoutMap, defaultStyleMap, defaultTemplate } from "./defaults.js";
export { normalize } from "./normalize/index.js";
export { paginate } from "./paginate.js";
export { markout } from "./markout/index.js";
export { collectStats } from "./stats.js";

/**
 * Convert a DOCX file to HTML pages through the full pipeline.
 *
 * Pipeline stages: DOCX bytes → mammoth (HTML extraction) → normalize
 * (structural cleanup) → paginate (split at H1 boundaries) → markout
 * (marker → HTML transformation) → collectStats → generatePages.
 *
 * All stages operate on CheerioAPI DOM instances, mutating in place
 * to avoid redundant parse/serialize cycles. HTML is only serialized
 * at the final output stage.
 *
 * @param docx - The DOCX file as raw bytes
 * @param options - Conversion options including the platform-specific converter
 * @returns Output files, statistics, and diagnostic messages
 */
export async function convert(docx: Uint8Array, options: ConvertOptions): Promise<ConvertResult> {
	const ctx: ConvertContext = {
		markoutMap: options.markoutMap ?? defaultMarkoutMap,
		assets: options.assets ?? new Map<string, Uint8Array>(),
		messages: []
	};

	const result = await options.converter(docx, {
		styleMap: options.styleMap ?? defaultStyleMap,
		onImage: createImageCollector(ctx)
	});

	const unknownStyles: string[] = [];
	for (const message of result.messages) {
		if (message.message.indexOf(" style: ") > -1) {
			unknownStyles.push(message.message.split("'")[1] ?? message.message);
		} else {
			ctx.messages.push({ level: "warning", source: "mammoth", text: message.message });
		}
	}
	if (unknownStyles.length) {
		ctx.messages.push({
			level: "warning",
			source: "mammoth",
			text: `Unknown Word styles: ${unknownStyles.join(", ")}`
		});
	}

	const $ = loadFragment(result.value);
	normalize($, ctx);
	let pages = paginate($);
	markout(pages, ctx);
	const stats = collectStats(pages, ctx);

	if (!pages.some(($page) => $page("h1").length > 0)) {
		ctx.messages.push({
			level: "warning",
			source: "pages",
			text: "No Heading 1 styles found. Pages split at Heading 1, so all content was placed on a single page."
		});
	}

	let files: OutputFile[] = [];
	if (options.writePages !== false) {
		files = generatePages(pages, options.template ?? defaultTemplate, ctx, options.documentName);

		for (const [name, data] of ctx.assets) {
			files.push({ filename: "assets/" + name, data });
		}
	}

	return { files, stats, messages: ctx.messages };
}

/**
 * Create an image collector callback that extracts images from the DOCX
 * and stores them as numbered assets in the conversion context.
 */
function createImageCollector(ctx: ConvertContext) {
	let imageID = 1;

	return async function onImage(image: { contentType: string; readBase64: () => Promise<string> }) {
		let base64: string;
		try {
			base64 = await image.readBase64();
		} catch {
			base64 = "";
		}
		if (!base64) {
			ctx.messages.push({
				level: "warning",
				source: "mammoth",
				text: "Could not read an image. It may be an externally hosted image; its src was left blank."
			});
			return { src: "" };
		}

		const extension = extensionOf("x." + image.contentType.split("/")[1]);
		const fileName = imageID + extension;
		imageID++;

		ctx.assets.set(fileName, base64ToBytes(base64));

		return { src: "assets/" + fileName };
	};
}

/** Convert a base64-encoded string to a Uint8Array. */
function base64ToBytes(base64: string) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
