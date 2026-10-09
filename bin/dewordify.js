#!/usr/bin/env node
import { run } from "../dist/cli/index.js";

const known = ["munch", "estimate", "strip", "serve"];
const arg2 = process.argv[2];

if (known.includes(arg2)) {
	run(arg2, process.argv[3]);
} else {
	run("dewordify", arg2);
}
