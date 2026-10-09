import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convert } from "../core/index.js";
import type { ConvertResult } from "../core/index.js";
import { browserConverter } from "./converter";
import { downloadZip } from "./zip";

type Status = "idle" | "converting" | "done" | "error";

/** Format a byte count into a human-readable string (e.g., "1.2 MB"). */
function formatBytes(bytes: number): string {
	if (bytes < 1024) return bytes + " B";
	const units = ["KB", "MB", "GB"];
	let value = bytes;
	let unit = -1;
	do {
		value /= 1024;
		unit++;
	} while (value >= 1024 && unit < units.length - 1);
	return value.toFixed(value >= 10 ? 0 : 1) + " " + units[unit];
}

/** Clamp a number between a minimum and maximum value. */
function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

/** Horizontal arrows icon for the width control. */
function WidthIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<line x1="2" y1="12" x2="22" y2="12" />
			<polyline points="7 7 2 12 7 17" />
			<polyline points="17 7 22 12 17 17" />
		</svg>
	);
}

/** Vertical arrows icon for the height control. */
function HeightIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<line x1="12" y1="2" x2="12" y2="22" />
			<polyline points="7 7 12 2 17 7" />
			<polyline points="7 17 12 22 17 17" />
		</svg>
	);
}

/** Fullscreen icon for the fullscreen toggle button. */
function FullscreenIcon() {
	return (
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M8 3H5a2 2 0 0 0-2 2v3" />
			<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
			<path d="M3 16v3a2 2 0 0 0 2 2h3" />
			<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
		</svg>
	);
}

const filenamePattern = /(\d{2}_[a-z0-9-]+\.[a-z0-9]+)/i;

/** Render message text with output filenames (e.g. `01_page.html`) bolded. */
function MessageText({ text }: { text: string }) {
	const parts = text.split(filenamePattern);
	return (
		<span>
			{parts.map((part, i) =>
				filenamePattern.test(part) ? <strong key={i}>{part}</strong> : part
			)}
		</span>
	);
}

/** Chevron icon that rotates to indicate a section's expanded state. */
function Chevron({ open }: { open: boolean }) {
	return (
		<svg className={open ? "open" : ""} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<polyline points="9 18 15 12 9 6" />
		</svg>
	);
}

/**
 * CSS injected into the iframe to force a classic, always-visible scrollbar
 * instead of the browser's slim overlay scrollbar.
 * Injected into the <head> before content renders to avoid layout shift.
 */
const scrollbarCss = [
	"html, body { overflow-y: scroll !important; }",
	"::-webkit-scrollbar { width: 16px !important; height: 16px !important; -webkit-appearance: none !important; }",
	"::-webkit-scrollbar-track { background: #f1f1f1 !important; }",
	"::-webkit-scrollbar-thumb { background: #c1c1c1 !important; border-radius: 7px !important; border: 3px solid #f1f1f1 !important; }",
	"::-webkit-scrollbar-thumb:hover { background: #9a9a9a !important; }",
	"scrollbar-width: auto !important;",
	"scrollbar-color: #c1c1c1 #f1f1f1 !important;",
].join("\n");

/**
 * Build a page's HTML string for previewing.
 * Replaces `assets/` references in src/href attributes with blob URLs.
 */
function pageHtml(result: ConvertResult, filename: string, assetUrls: Map<string, string>) {
	const file = result.files.find((f) => f.filename === filename);
	if (typeof file?.data !== "string") return "";
	const withScrollbar = file.data.replace("</head>", `<style>${scrollbarCss}</style></head>`);
	return withScrollbar.replace(/(src|href)="assets\/([^"]+)"/g, (match, attr: string, name: string) => {
		const url = assetUrls.get(name);
		return url ? `${attr}="${url}"` : match;
	});
}

/**
 * Build a single HTML document containing the body content of all HTML pages,
 * separated by a horizontal rule, for previewing all files at once.
 */
function allPagesHtml(result: ConvertResult, assetUrls: Map<string, string>) {
	const htmlFiles = result.files.filter((f) => f.filename.endsWith(".html") && typeof f.data === "string");
	if (htmlFiles.length === 0) return "";
	const bodies = htmlFiles.map((f) => {
		const html = (f.data as string).replace(/(src|href)="assets\/([^"]+)"/g, (match, attr: string, name: string) => {
			const url = assetUrls.get(name);
			return url ? `${attr}="${url}"` : match;
		});
		const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
		const body = bodyMatch ? bodyMatch[1] : html;
		return body.replace(/<script[^>]*src="[^"]*sugar-suite\.ltc\.bcit\.ca[^"]*"[^>]*><\/script>/gi, "");
	});
	return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
	<meta charset="utf-8">
	<meta http-equiv="x-ua-compatible" content="ie=edge">
	<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=yes">
	<link rel="stylesheet" href="https://sugar-suite.ltc.bcit.ca/css/bcit.css">
	<script src="https://sugar-suite.ltc.bcit.ca/js/vendor/modernizr.js"></script>
	<style>${scrollbarCss}</style>
</head>
<body>
	<div class="container">
		${bodies.join("\n\t\t<hr>\n\t\t")}
	</div>
	<script src="https://sugar-suite.ltc.bcit.ca/js/lat.js"></script>
</body>
</html>`;
}


/**
 * Main application component for the web UI.
 *
 * Provides a drag-and-drop interface for DOCX files, runs the conversion
 * pipeline, and displays results including summary statistics, output
 * files, learning blocks, diagnostic messages, and a page preview iframe.
 */
export function App() {
	const [file, setFile] = useState<File | null>(null);
	const [dragging, setDragging] = useState(false);
	const [status, setStatus] = useState<Status>("idle");
	const [result, setResult] = useState<ConvertResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [previewPage, setPreviewPage] = useState<string | null>(null);
	const [summaryOpen, setSummaryOpen] = useState(true);
	const [learningBlocksOpen, setLearningBlocksOpen] = useState(true);
	const [messagesOpen, setMessagesOpen] = useState(true);
	const [filesOpen, setFilesOpen] = useState(false);
	const [previewWidth, setPreviewWidth] = useState(100);
	const [previewHeight, setPreviewHeight] = useState(70);
	const [autoHeight, setAutoHeight] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const previewCardRef = useRef<HTMLElement>(null);
	// Mirror of `file` state so an async conversion can detect a mid-flight file change.
	const fileRef = useRef<File | null>(null);
	useEffect(() => {
		fileRef.current = file;
	}, [file]);

	const assetUrls = useMemo(() => {
		const urls = new Map<string, string>();
		if (!result) return urls;
		for (const f of result.files) {
			if (f.filename.startsWith("assets/") && f.data instanceof Uint8Array) {
				urls.set(f.filename.slice("assets/".length), URL.createObjectURL(new Blob([f.data as BlobPart])));
			}
		}
		return urls;
	}, [result]);

	useEffect(() => {
		return () => {
			for (const url of assetUrls.values()) URL.revokeObjectURL(url);
		};
	}, [assetUrls]);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!result || !previewPage) {
			setPreviewUrl(null);
			return;
		}
		const html = previewPage === "__all__" ? allPagesHtml(result, assetUrls) : pageHtml(result, previewPage, assetUrls);
		const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [result, previewPage, assetUrls]);

	/** Replace the selected file, discarding any result from another file. */
	function selectFile(next: File | null) {
		setFile(next);
		setResult(null);
		setError(null);
		setPreviewPage(null);
		setStatus("idle");
	}

	const onDrop = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		setDragging(false);
		const dropped = event.dataTransfer.files?.[0];
		if (dropped) selectFile(dropped);
	}, []);

	/** Clear the selected file and all conversion state. */
	function clearFile() {
		setFile(null);
		setResult(null);
		setError(null);
		setPreviewPage(null);
		setStatus("idle");
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function runConversion() {
		if (!file) return;
		const convertingFile = file;
		setStatus("converting");
		setError(null);
		setResult(null);

		try {
			const bytes = new Uint8Array(await convertingFile.arrayBuffer());
			const converted = await convert(bytes, {
				converter: browserConverter,
				documentName: convertingFile.name.replace(/\.docx$/i, "")
			});
			// Ignore the result if the user selected a different file mid-conversion.
			if (fileRef.current !== convertingFile) return;
			setResult(converted);
			setPreviewPage(converted.files.find((f) => f.filename.endsWith(".html"))?.filename ?? null);
			setStatus("done");
		} catch (err) {
			if (fileRef.current !== convertingFile) return;
			setError(err instanceof Error ? err.message : String(err));
			setStatus("error");
		}
	}

	async function onDownload() {
		if (!result || !file) return;
		const zipName = file.name.replace(/\.docx$/i, "") + ".zip";
		await downloadZip(zipName, result.files);
	}

	const converting = status === "converting";

	return (
		<main className="container">
			<h1>Dewordify</h1>
			<p className="tagline">Convert a Word document (.docx) into HTML pages.</p>

			<label
				className={dragging ? "drop-zone dragging" : "drop-zone"}
				onDragOver={(event) => {
					event.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={onDrop}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept=".docx"
					onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
				/>
				{file ? (
					<div className="file-card">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
						</svg>
						<div className="file-meta">
							<span className="file-name">{file.name}</span>
							<span className="file-size">{formatBytes(file.size)}</span>
						</div>
						<button
							type="button"
							className="icon-btn"
							title="Remove file"
							disabled={converting}
							onClick={(event) => {
								event.preventDefault();
								clearFile();
							}}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				) : (
					<>
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<polyline points="16 16 12 12 8 16" />
							<line x1="12" y1="12" x2="12" y2="21" />
							<path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
						</svg>
						<p className="drop-title">Drop a .docx file here</p>
						<p className="drop-hint">or click to browse your files</p>
					</>
				)}
			</label>

			<div className="actions">
				<button className="btn" onClick={runConversion} disabled={!file || converting}>
					{converting && <span className="spinner" aria-hidden="true" />}
					{converting ? "Converting DOCX…" : "Convert DOCX"}
				</button>
				<button
					className="btn btn-secondary"
					onClick={onDownload}
					disabled={!result}
					title={result ? "Download all output files as a ZIP archive" : "Convert a document to enable downloading"}
				>
					Download ZIP
				</button>
			</div>

			{status === "error" && (
				<div className="banner" role="alert">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span className="banner-text">
						<strong>Conversion failed.</strong> {error}
					</span>
					<button
						type="button"
						className="icon-btn"
						title="Dismiss"
						onClick={() => {
							setError(null);
							setStatus("idle");
						}}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			)}

			{result && (
				<>
					<section className="card">
						<button
							type="button"
							className="collapse-toggle"
							onClick={() => setSummaryOpen((open) => !open)}
							aria-expanded={summaryOpen}
						>
							Summary
							<Chevron open={summaryOpen} />
						</button>
						{summaryOpen && (
							<dl className="stat-list collapse-body">
								{result.stats.structures.map((structure) => (
									<div className="stat-row" key={structure.name}>
										<dt>{structure.name}:</dt>
										<dd>
											{structure.count}
											{structure.hint && <span className="stat-hint">{structure.hint}</span>}
										</dd>
									</div>
								))}
							</dl>
						)}
					</section>

					{result.stats.learningBlocks.length > 0 && (
						<section className="card">
							<button
								type="button"
								className="collapse-toggle"
								onClick={() => setLearningBlocksOpen((open) => !open)}
								aria-expanded={learningBlocksOpen}
							>
								Learning Blocks
								<Chevron open={learningBlocksOpen} />
							</button>
							{learningBlocksOpen && (
								<dl className="stat-list collapse-body">
									{result.stats.learningBlocks.map((marker) => (
										<div className="stat-row" key={marker.name}>
											<dt>{marker.name}:</dt>
											<dd>{marker.count}</dd>
										</div>
									))}
								</dl>
							)}
						</section>
					)}

					<section className="card">
						<button
							type="button"
							className="collapse-toggle"
							onClick={() => setFilesOpen((open) => !open)}
							aria-expanded={filesOpen}
						>
							Files ({result.files.length})
							<Chevron open={filesOpen} />
						</button>
						{filesOpen && (
							<ul className="messages collapse-body">
								{result.files.map((f) => (
									<li key={f.filename}>{f.filename}</li>
								))}
							</ul>
						)}
					</section>

					{result.messages.length > 0 && (
						<section className="card">
							<button
								type="button"
								className="collapse-toggle"
								onClick={() => setMessagesOpen((open) => !open)}
								aria-expanded={messagesOpen}
							>
								Messages ({result.messages.length})
								<Chevron open={messagesOpen} />
							</button>
							{messagesOpen && (
								<ul className="messages collapse-body">
									{result.messages.map((message, index) => (
										<li key={index} className={message.level}>
											<span className="msg-source">{message.source}:</span>
											<MessageText text={message.text} />
										</li>
									))}
								</ul>
							)}
						</section>
					)}

					{previewPage && (
						<section
							ref={previewCardRef}
							className={`card${autoHeight ? " auto-height" : ""}${fullscreen ? " fullscreen" : ""}`}
							style={autoHeight || fullscreen ? undefined : {
								width: previewWidth + "%",
								marginLeft: `calc((100% - ${previewWidth}%) / 2)`
							}}
						>
							<h2>Preview</h2>
							<div className="preview-layout">
								<ul className="page-list">
									<li key="__all__">
										<button
											className={previewPage === "__all__" ? "page-link active" : "page-link"}
											onClick={() => setPreviewPage("__all__")}
										>
											All Files
										</button>
									</li>
									{result.files
										.filter((f) => f.filename.endsWith(".html"))
										.map((f) => (
											<li key={f.filename}>
												<button
													className={f.filename === previewPage ? "page-link active" : "page-link"}
													onClick={() => setPreviewPage(f.filename)}
												>
													{f.filename}
												</button>
											</li>
										))}
								</ul>
								<div className="preview-pane">
									<div className="preview-toolbar">
										{previewUrl && (
											<a className="open-tab" href={previewUrl} target="_blank" rel="noreferrer">
												Open in new tab
											</a>
										)}
										<label className="size-control" title="Preview width as a percentage of the page">
											<WidthIcon />
											Width:
											<input
												type="number"
												min={25}
												max={200}
												step={5}
												value={previewWidth}
												onChange={(event) => {
													const value = Number(event.target.value);
													if (!Number.isNaN(value)) {
														setPreviewWidth(clampNumber(value, 25, 200));
													}
												}}
											/>
											%
										</label>
										<label className="size-control" title="Preview height as a percentage of the viewport height">
											<HeightIcon />
											Height:
											<input
												type="number"
												min={30}
												max={150}
												step={5}
												value={previewHeight}
												onChange={(event) => {
													const value = Number(event.target.value);
													if (!Number.isNaN(value)) {
														setAutoHeight(false);
														setFullscreen(false);
														setPreviewHeight(clampNumber(value, 30, 150));
													}
												}}
											/>
											vh
										</label>
										<button
											className={`btn btn-secondary${autoHeight ? " active" : ""}`}
											onClick={() => {
												setFullscreen(false);
												setAutoHeight((v) => {
													if (!v) setTimeout(() => previewCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
													return !v;
												});
											}}
											title="Stick preview card to top of screen at full viewport height"
										>
											Auto Height
										</button>
										<button
											className={`btn btn-secondary${fullscreen ? " active" : ""}`}
											onClick={() => {
												setAutoHeight(false);
												setFullscreen((v) => {
													if (v) setTimeout(() => previewCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
													return !v;
												});
											}}
											title="Expand preview card to fullscreen"
										>
											<FullscreenIcon />
										</button>
									</div>
									<iframe
										title="Page preview"
										className="preview"
										// Converted documents can contain active content from uploads.
										// Blob URLs would otherwise inherit this app's origin.
										// The sandbox gives the preview an opaque origin while still allowing lat.js scripts to run.
										sandbox="allow-scripts"
										style={{ height: (autoHeight || fullscreen) ? "calc(100vh - 120px)" : previewHeight + "vh" }}
										src={previewUrl ?? undefined}
									/>
								</div>
							</div>
						</section>
					)}

				</>
			)}
		</main>
	);
}
