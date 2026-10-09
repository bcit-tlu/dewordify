import jsBeautify from "js-beautify";

const beautifyHtml = jsBeautify.html;

/** js-beautify configuration for consistent HTML output formatting. */
export const beautifyOptions = {
	indent_size: 1,
	indent_char: "\t",
	wrap_line_length: 0,
	preserve_newlines: true,
	max_preserve_newlines: 3
};

/** Format HTML with consistent indentation and line wrapping. */
export function beautify(html: string): string {
	return beautifyHtml(html, beautifyOptions);
}
