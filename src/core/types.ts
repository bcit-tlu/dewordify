/**
 * Defines the marker vocabulary used in Word documents to indicate
 * content boundaries (e.g., "#image" ... "/image"). The `start` and
 * `end` strings are the prefix characters, and `wrappers` maps marker
 * names to the HTML wrapper elements that replace them.
 */
export interface MarkoutMap {
	start: string;
	end: string;
	wrappers: Record<string, string>;
	mappings: Record<string, string>;
}

/** Severity levels for conversion messages. */
export type MessageLevel = "info" | "warning" | "error";

/** A diagnostic message produced during conversion. */
export interface Message {
	level: MessageLevel;
	source: "mammoth" | "markout" | "normalize" | "pages";
	text: string;
}

/** A message emitted by the mammoth DOCX→HTML converter. */
export interface MammothMessage {
	type: string;
	message: string;
}

/** An image element as provided by mammoth during conversion. */
export interface MammothImageElement {
	contentType: string;
	readBase64: () => Promise<string>;
}

/** Options passed to the DOCX→HTML converter (mammoth). */
export interface DocxConvertOptions {
	styleMap: string[];
	onImage: (image: MammothImageElement) => Promise<{ src: string }> | { src: string };
}

/** The raw result returned by the mammoth converter. */
export interface MammothResult {
	value: string;
	messages: MammothMessage[];
}

/** A function that converts DOCX bytes to HTML via mammoth. */
export type DocxToHtml = (bytes: Uint8Array, options: DocxConvertOptions) => Promise<MammothResult>;

/** A single output file produced by the conversion pipeline. */
export interface OutputFile {
	filename: string;
	data: string | Uint8Array;
}

/** Statistics about a structural element type (pages, images, tables, etc.). */
export interface StructureStat {
	name: string;
	count: number;
	hint?: string;
}

/** Statistics about a markout marker type (learning blocks, interactions, etc.). */
export interface MarkerStat {
	name: string;
	count: number;
}

/** Aggregate statistics produced by the conversion pipeline. */
export interface Stats {
	structures: StructureStat[];
	learningBlocks: MarkerStat[];
}

/** Options accepted by the main {@link convert} function. */
export interface ConvertOptions {
	converter: DocxToHtml;
	styleMap?: string[];
	markoutMap?: MarkoutMap;
	template?: string;
	assets?: Map<string, Uint8Array>;
	writePages?: boolean;
	documentName?: string;
}

/** The result returned by the main {@link convert} function. */
export interface ConvertResult {
	files: OutputFile[];
	stats: Stats;
	messages: Message[];
}

/** Shared context threaded through all pipeline stages. */
export interface ConvertContext {
	markoutMap: MarkoutMap;
	assets: Map<string, Uint8Array>;
	messages: Message[];
	/** Output filename of the page currently being processed (set by markout). */
	pageFilename?: string;
}
