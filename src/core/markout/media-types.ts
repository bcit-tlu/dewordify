const mediaExtensions = [".mp3", ".ogg", ".wav", ".mp4", ".m4a", ".webm"];

const extensionToMime = new Map<string, string>([
	[".mp3", "mpeg"],
	[".ogg", "ogg"],
	[".wav", "wav"],
	[".mp4", "mp4"],
	[".m4a", "mp4"],
	[".webm", "webm"]
]);

/**
 * Determine the MIME type for a media source based on its file extension.
 * Returns `"link"` for external URLs without a recognized media extension,
 * `null` for unrecognized local files, or a MIME type string like
 * `"audio/mpeg"` or `"video/mp4"`.
 */
export function mediaType(media: "audio" | "video", src: string): string | null {
	let ext = extractExtension(src).toLowerCase();
	if (/^((http|https|ftp):)/.test(src) && !mediaExtensions.includes(ext)) {
		ext = "link";
	}

	if (ext === "link") return "link";

	const mime = extensionToMime.get(ext);
	if (!mime) return null;

	return media + "/" + mime;
}

/** Extract the file extension from a URL or file path. */
function extractExtension(src: string): string {
	if (/^((http|https|ftp):)/.test(src)) {
		try {
			const pathname = new URL(src).pathname;
			const dot = pathname.lastIndexOf(".");
			if (dot > 0) return pathname.slice(dot);
		} catch {
			// fall through to simple extraction
		}
	}
	const dot = src.lastIndexOf(".");
	if (dot > 0) return src.slice(dot);
	return "";
}
