import mammoth from "mammoth";
import type { DocxToHtml } from "../core/index.js";

/**
 * Node.js DOCX→HTML converter using mammoth.
 * Reads images as Buffer and converts to base64 for the onImage callback.
 */
export const nodeConverter: DocxToHtml = async function (bytes, options) {
	const result = await mammoth.convertToHtml(
		{ buffer: Buffer.from(bytes) },
		{
			styleMap: options.styleMap,
			convertImage: mammoth.images.imgElement(async function (element) {
				return options.onImage({
					contentType: element.contentType,
					readBase64: async function () {
						const read = element.read("base64");
						read.catch(() => undefined);
						return read.catch(() => "");
					}
				});
			})
		}
	);

	return { value: result.value, messages: result.messages };
};
