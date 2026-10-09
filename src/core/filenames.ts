/**
 * Generate a filename from a page number and heading text.
 * Produces names like `01_introduction.html` or `12_week-2-getting-started.html`.
 */
export function getFileName(number: number, string: string, extension: string) {
	return doubleDigits(number) + "_" + slugify(string, 60) + extension;
}

/** Convert a string to a URL-safe slug (lowercase, alphanumeric with dashes). */
function slugify(string: string, charLimit?: number) {
	const escaped = JSON.stringify(string);
	const dirtyWords = escaped.replace(/(-|_)/g, " ").replace(/\s+/g, " ").split(" ");
	const cleanWords = dirtyWords.map(function (word) {
		return word.replace(/\W/g, "");
	});

	const combined = cleanWords.join("-").toLowerCase();
	return charLimit ? combined.substring(0, charLimit) : combined;
}

/** Zero-pad a number to two digits (e.g., 1 → "01"). */
function doubleDigits(num: number) {
	if (num < 10) {
		return "0" + num;
	}
	return "" + num;
}

/** Sanitize a filename by slugifying the base name while preserving the extension. */
export function sanitizeFileName(fileName: string) {
	const ext = extensionOf(fileName);
	const base = fileName.slice(0, fileName.length - ext.length);
	return slugify(base) + ext;
}

/** Extract the file extension (including the dot) from a filename. */
export function extensionOf(fileName: string) {
	const dot = fileName.lastIndexOf(".");
	if (dot <= 0) return "";
	return fileName.slice(dot);
}

/**
 * Extract an extension from user-provided text (e.g., a linked-file name in a
 * heading) for use in an output filename. Only simple dot-extensions are
 * accepted; anything containing path separators or traversal segments (e.g.
 * "x.a/../../evil") resolves to "" so the generated name stays inert.
 */
export function safeExtensionOf(fileName: string) {
	const ext = extensionOf(fileName);
	return /^\.[A-Za-z0-9]{1,10}$/.test(ext) ? ext : "";
}
