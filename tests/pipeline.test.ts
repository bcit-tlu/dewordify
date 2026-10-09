import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convert } from "../src/core/index.js";
import { nodeConverter } from "../src/cli/converter.js";
import { getFileName } from "../src/core/filenames.js";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

function readFixture(name: string) {
	return new Uint8Array(fs.readFileSync(path.join(fixturesDir, name)));
}

describe("filenames", () => {
	it("matches v1 naming behaviour", () => {
		expect(getFileName(1, "Introduction", ".html")).toBe("01_introduction.html");
		expect(getFileName(12, "Week 2: Getting Started!", ".html")).toBe("12_week-2-getting-started.html");
	});
});

describe("convert", () => {
	it("converts the hidden-styles sample into pages", async () => {
		const result = await convert(readFixture("sample-all-hidden-styles.docx"), {
			converter: nodeConverter
		});

		const htmlFiles = result.files.filter((file) => file.filename.endsWith(".html"));
		expect(htmlFiles.length).toBeGreaterThan(0);

		for (const file of htmlFiles) {
			expect(file.filename).toMatch(/^\d{2}_.+\.html$/);
			expect(file.data as string).toContain("<h1>");
		}
	});

	it("documents without Heading 1 produce a single named page", async () => {
		const noHeadings = async () => ({
			value: "<ul><li><strong>News</strong><ul><li><a href=\"https://example.com\">link</a></li></ul></li></ul>",
			messages: []
		});

		const result = await convert(new Uint8Array(), {
			converter: noHeadings,
			documentName: "Retrofit-QA"
		});

		const htmlFiles = result.files.filter((file) => file.filename.endsWith(".html"));
		expect(htmlFiles.length).toBe(1);
		expect(htmlFiles[0].filename).toBe("01_retrofit-qa.html");
		expect(htmlFiles[0].data as string).toContain("<title>Retrofit-QA</title>");
		expect(htmlFiles[0].data as string).toContain("https://example.com");
		expect(result.messages.some((m) => m.text.includes("No Heading 1"))).toBe(true);
	});
});
