import fs from "node:fs";
import path from "node:path";
import { beautify } from "../core/beautify.js";

export function strip(cwd: string) {
	const htmlFiles = fs.readdirSync(cwd)
		.filter((item) => path.extname(item) === ".html");

	for (const fileName of htmlFiles) {
		const filePath = path.join(cwd, fileName);
		const stripped = stripComments(fs.readFileSync(filePath, "utf8"));
		fs.writeFileSync(filePath, beautify(stripped));
		console.log("Stripped " + fileName);
	}
}

function stripComments(source: string) {
	return source.replace(/\s*?<!--NOTE:(.|\n)*?-->\s*?/g, "");
}
