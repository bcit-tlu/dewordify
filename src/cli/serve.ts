import http from "node:http";
import { convert, defaultStyleMap, defaultTemplate } from "../core/index.js";
import type { ConvertResult } from "../core/index.js";
import { nodeConverter } from "./converter.js";

// Uploads are buffered in memory, so cap the body size.
const MAX_UPLOAD_BYTES =
	parseInt(process.env.DEWORDIFY_MAX_UPLOAD_MB ?? "", 10) > 0
		? parseInt(process.env.DEWORDIFY_MAX_UPLOAD_MB ?? "", 10) * 1024 * 1024
		: 50 * 1024 * 1024;

// Bind to localhost by default; set DEWORDIFY_HOST to expose other interfaces.
const HOST = process.env.DEWORDIFY_HOST ?? "127.0.0.1";
// Optional bearer token: when set, /convert requires it while /health stays open.
const API_KEY = process.env.DEWORDIFY_API_KEY;

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(body));
}

/**
 * Start a minimal HTTP API server for pipeline integration.
 *
 * Endpoints:
 *   GET  /health  — health check
 *   POST /convert — convert a .docx file (raw binary body)
 *
 * The /convert response is JSON:
 *   { files: [{ filename, data(base64) }], stats, messages }
 */
export function serve(port: number) {
	const server = http.createServer(async (req, res) => {
		if (req.method === "GET" && req.url === "/health") {
			sendJson(res, 200, { status: "ok" });
			return;
		}

		if (req.method === "POST" && req.url === "/convert") {
			if (API_KEY && req.headers.authorization !== `Bearer ${API_KEY}`) {
				sendJson(res, 401, { error: "Unauthorized" });
				req.destroy();
				return;
			}

			const chunks: Buffer[] = [];
			let received = 0;
			// True once the response has been claimed by an early failure path (oversized/aborted/errored upload).
			let settled = false;

			req.on("data", (chunk: Buffer) => {
				if (settled) return;
				received += chunk.length;
				if (received > MAX_UPLOAD_BYTES) {
					settled = true;
					sendJson(res, 413, { error: "Upload too large" });
					req.destroy();
					return;
				}
				chunks.push(chunk);
			});
			req.on("error", () => {
				// Aborted or errored uploads never fire "end"; just drop the buffers.
				settled = true;
				chunks.length = 0;
			});
			req.on("end", async () => {
				if (settled) return;
				settled = true;
				try {
					const buffer = Buffer.concat(chunks);
					const result: ConvertResult = await convert(new Uint8Array(buffer), {
						converter: nodeConverter,
						styleMap: defaultStyleMap,
						template: defaultTemplate,
						writePages: true,
						documentName: "document"
					});

					const payload = {
						files: result.files.map((f) => ({
							filename: f.filename,
							data: typeof f.data === "string"
								? f.data
								: Buffer.from(f.data).toString("base64")
						})),
						stats: result.stats,
						messages: result.messages
					};

					sendJson(res, 200, payload);
				} catch (err) {
					sendJson(res, 500, { error: String(err) });
				}
			});
			return;
		}

		sendJson(res, 404, { error: "Not found" });
	});

	server.listen(port, HOST, () => {
		console.log(`Dewordify API server listening on http://${HOST}:${port}`);
		console.log("  POST /convert  — upload a .docx (raw binary body), get JSON back");
		console.log("  GET  /health   — health check");
		if (HOST === "127.0.0.1") {
			console.log("  Listening on localhost only. Set DEWORDIFY_HOST to expose other interfaces.");
		}
		if (API_KEY) {
			console.log("  DEWORDIFY_API_KEY is set; /convert requires a Bearer token.");
		} else {
			console.log("  WARNING: DEWORDIFY_API_KEY is not set; /convert is unauthenticated.");
		}
		console.log("");
		console.log("Example:");
		console.log(`  curl -X POST http://${HOST}:${port}/convert \\`);
		console.log("    --data-binary @document.docx \\");
		console.log('    -H "Content-Type: application/octet-stream"');
	});
}
