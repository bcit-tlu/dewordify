import JSZip from "jszip";
import type { OutputFile } from "../core/index.js";

/**
 * Package output files into a ZIP archive and trigger a browser download.
 */
export async function downloadZip(zipName: string, files: OutputFile[]) {
	const zip = new JSZip();

	for (const file of files) {
		zip.file(file.filename, file.data);
	}

	const blob = await zip.generateAsync({ type: "blob" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = zipName;
	anchor.click();
	URL.revokeObjectURL(url);
}
