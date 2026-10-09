declare module "js-beautify" {
	const beautify: {
		html(source: string, options?: Record<string, unknown>): string;
		css(source: string, options?: Record<string, unknown>): string;
		js(source: string, options?: Record<string, unknown>): string;
	};
	export default beautify;
}

declare module "mammoth/mammoth.browser" {
	const mammoth: {
		convertToHtml(
			input: { arrayBuffer: ArrayBuffer },
			options?: Record<string, unknown>
		): Promise<{ value: string; messages: { type: string; message: string }[] }>;
		images: {
			imgElement(
				handler: (element: {
					contentType: string;
					read: (encoding?: string) => Promise<unknown>;
				}) => Promise<{ src: string }> | { src: string }
			): unknown;
		};
	};
	export default mammoth;
}
