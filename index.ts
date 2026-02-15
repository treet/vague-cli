#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { buildSystemPrompt } from "./system-prompt";
import type { RequestBody } from "./types";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:3b";

const printDebug = (body: RequestBody) => {
	const dim = "\x1b[2m";
	const bold = "\x1b[1m";
	const reset = "\x1b[0m";
	const cyan = "\x1b[36m";
	const sep = `${cyan}${"─".repeat(40)}${reset}`;

	console.log(`${bold}model:${reset} ${body.model}`);
	console.log(
		`${bold}options:${reset} temp=${body.options.temperature} top_p=${body.options.top_p} repeat_penalty=${body.options.repeat_penalty}`,
	);
	console.log(`\n${sep}\n${bold}system${reset}\n${sep}`);
	console.log(body.system);
	console.log(`\n${sep}\n${bold}prompt${reset}\n${sep}`);
	console.log(body.prompt);
	console.log(`${dim}${sep}${reset}`);
};

const { values, positionals } = parseArgs({
	args: Bun.argv,
	options: {
		debug: { type: "boolean", default: false },
	},
	strict: true,
	allowPositionals: true,
});

const intent = positionals.slice(2).join(" ").trim();

if (!intent) {
	console.error("Usage: vague <natural language intent>");
	process.exit(1);
}

const body: RequestBody = {
	model: MODEL,
	system: buildSystemPrompt(),
	prompt: intent,
	stream: false,
	options: {
		temperature: 0.1,
		top_p: 0.9,
		repeat_penalty: 1.0,
	},
};

if (values.debug) printDebug(body);

try {
	const res = await fetch(`${OLLAMA_URL}/api/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		console.error(`Ollama error: ${res.status} ${res.statusText}`);
		process.exit(1);
	}

	const { response } = (await res.json()) as { response: string };

	// The model is instructed to output plain text, but doesn't always listen.
	const stripMarkdown = (s: string): string =>
		s
			.replace(/^```\w*\n?/gm, "")
			.replace(/^`|`$/g, "")
			.trim();

	console.log(stripMarkdown(response));
} catch (err) {
	const message = err instanceof Error ? err.message : String(err);
	console.error(`Error: ${message}`);
	process.exit(1);
}
