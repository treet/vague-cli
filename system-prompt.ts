import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const INSTRUCTIONS = `You convert natural-language intents into safe, correct, minimal terminal commands.

Output: exactly one line of plain text — no markdown, no code fences, no backticks, no \`\`\`, no \`\`\`sh, no commentary, no surrounding text. Raw command only. Chain sequential steps with && on a single line. If required context is missing, output exactly one short question instead.

Prefer explicit, predictable flags over cleverness; keep commands readable and reversible when possible.
Never invent paths, files, or binaries; only use what the user names or what is universal (., ~, $PWD).
Preserve user-provided literals verbatim; quote safely when spaces/metacharacters may occur.
No pipelines unless they materially improve correctness.

Destructive, privileged, or stateful actions are high-risk: use a preview variant (--dry-run, echo, find) or ask for confirmation.

"open" when referring to a file means to open a file using \`vim\`.
"show" when referring to a file means to display the contents of a file using \`cat\`.
`;

import type { Context } from "./types";

const MAX_DIR_ENTRIES = 50;

const KNOWN_CLIS = [
	"claude",
	"docker",
	"gh",
	"git",
	"jq",
	"nc",
	"ngrok",
	"nslookup",
	"openssl",
	"rsync",
	"tar",
	"curl",
	"wget",
];

const exec = (cmd: string): string | null => {
	try {
		return execSync(cmd, { encoding: "utf-8", timeout: 2000 }).trim();
	} catch {
		return null;
	}
};

const detectPackageManager = (): string | null => {
	if (existsSync("bun.lockb") || existsSync("bun.lock")) return "bun";
	if (existsSync("pnpm-lock.yaml")) return "pnpm";
	if (existsSync("yarn.lock")) return "yarn";
	if (existsSync("package-lock.json")) return "npm";
	return null;
};

const detectGitBranch = (): string | null => exec("git branch --show-current");

const detectGitBranches = (): string[] => {
	const raw = exec("git branch --format='%(refname:short)'");
	return raw ? raw.split("\n").filter(Boolean) : [];
};

const detectGitDirty = (): boolean => {
	const status = exec("git status --porcelain");
	return status !== null && status.length > 0;
};

const listCwd = (): string[] => {
	try {
		const entries = readdirSync(".");
		if (entries.length <= MAX_DIR_ENTRIES) return entries;
		return [
			...entries.slice(0, MAX_DIR_ENTRIES),
			`… (${entries.length - MAX_DIR_ENTRIES} more)`,
		];
	} catch {
		return [];
	}
};

const detectClis = (): string[] =>
	KNOWN_CLIS.filter((cli) => exec(`which ${cli}`) !== null);

const collectContext = (): Context => ({
	shell: process.env.SHELL?.split("/").pop() ?? "sh",
	os: process.platform === "darwin" ? "macOS (BSD userland)" : process.platform,
	packageManager: detectPackageManager(),
	gitBranch: detectGitBranch(),
	gitBranches: detectGitBranches(),
	gitDirty: detectGitDirty(),
	cwd: listCwd(),
	availableClis: detectClis(),
});

const formatContext = (ctx: Context): string => {
	const lines = [`Shell: ${ctx.shell}`, `OS: ${ctx.os}`];

	if (ctx.packageManager) lines.push(`Package manager: ${ctx.packageManager}`);
	if (ctx.gitBranch)
		lines.push(`Git branch: ${ctx.gitBranch}${ctx.gitDirty ? " (dirty)" : ""}`);
	if (ctx.gitBranches.length > 0)
		lines.push(`Git branches: ${ctx.gitBranches.join(", ")}`);
	if (ctx.availableClis.length > 0)
		lines.push(`Available CLIs: ${ctx.availableClis.join(", ")}`);
	if (ctx.cwd.length > 0) lines.push(`Files in cwd: ${ctx.cwd.join(", ")}`);

	return `\nEnvironment:\n${lines.map((l) => `- ${l}`).join("\n")}`;
};

export const buildSystemPrompt = (): string => {
	const ctx = collectContext();
	return `${INSTRUCTIONS}\n${formatContext(ctx)}`;
};
