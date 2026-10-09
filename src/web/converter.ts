import mammoth from "mammoth/mammoth.browser";
import type { DocxToHtml } from "../core/index.js";

/**
 * Browser DOCX→HTML converter using mammoth's browser build.
 * Reads images as ArrayBuffer and converts to base64 for the onImage callback.
 */
export const browserConverter: DocxToHtml = async function (bytes, options) {
	const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

	const result = await mammoth.convertToHtml(
		{ arrayBuffer },
		{
			styleMap: options.styleMap,
			convertImage: mammoth.images.imgElement(async function (element) {
				return options.onImage({
					contentType: element.contentType,
					readBase64: async function () {
						const read = element.read("base64") as Promise<string>;
						read.catch(() => undefined);
						return read.catch(() => "");
					}
				});
			})
		}
	);

	return { value: result.value, messages: result.messages };
};
