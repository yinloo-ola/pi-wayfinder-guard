import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir, isToolCallEventType } from "@earendil-works/pi-coding-agent";

import registerSubagentTool from "./subagent/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Fog guard — enforce "no implementation during wayfinder".
//
// Wayfinder is for clearing fog: explore, grill, plan, and write notes,
// tickets, CONTEXT.md, and ADRs. Implementation (source edits, builds,
// commits) belongs to the later spec → tickets → implement → review phases.
//
// `/wayfinder` toggles fog mode on; `/wayfinder off` turns it off. While on,
// a denylist blocks implementation actions and returns a reason so the model
// can self-correct. The denylist is intentionally additive — extend it to
// cover your stack.
// ---------------------------------------------------------------------------

let fogMode = false;

interface DenyRule {
	/** Shown to the model when this rule blocks an action. */
	reason: string;
	/** Returns true if the rule matches the given path or command. */
	match: (value: string) => boolean;
}

// Editing these paths is implementation.
const FOG_DENY_PATHS: DenyRule[] = [
	{
		reason:
			"Fog mode (/wayfinder) blocks source-code edits — wayfinder is for clearing fog, not implementing. Run `/wayfinder off` once you have a spec.",
		match: (p) =>
			/\.(ts|tsx|js|jsx|mjs|cjs|go|py|pyi|rs|java|kt|kts|swift|rb|php|c|h|cc|cpp|hpp|cs|scala|clj|ex|exs|fs|hs|jl|lua|pl|pm|r|sh|bash|sql|vue|svelte|dart|zig|nim)\b/i.test(
				p,
			),
	},
	{
		reason:
			"Fog mode (/wayfinder) blocks dependency/manifest/config changes — that is implementation. Run `/wayfinder off` first.",
		match: (p) =>
			/(^|[\\/])(package\.json|package-lock\.json|tsconfig\.json|jsconfig\.json|go\.mod|go\.sum|cargo\.toml|cargo\.lock|pyproject\.toml|requirements\.txt|pipfile|pipfile\.lock|uv\.lock|poetry\.lock|pom\.xml|build\.gradle|build\.gradle\.kts|gemfile|gemfile\.lock|composer\.json|makefile|cmakelists\.txt)([\\/]|$)/i.test(
				p,
			) ||
			/(^|[\\/])\.env(\.|$)/i.test(p) ||
			/\.lock$/i.test(p),
	},
];

// Running these commands is implementation. Test/build/run are deliberately
// NOT blocked: with source writes blocked (FOG_DENY_PATHS), they can only act
// on existing code — which is exploration (reproduce a bug, read behaviour).
const FOG_DENY_COMMANDS: DenyRule[] = [
	{
		reason:
			"Fog mode (/wayfinder) blocks git mutations (commit/push/restore/apply/clean/rm/mv/…) — git is off-limits while clearing fog. Run `/wayfinder off` first.",
		match: (cmd) =>
			/\bgit\s+(commit|push|tag|cherry-pick|rebase|merge|reset|revert|apply|restore|clean|rm|mv)\b/i.test(cmd),
	},
	{
		reason:
			"Fog mode (/wayfinder) blocks dependency installs — adding packages is implementation. Run `/wayfinder off` first.",
		match: (cmd) =>
			/\b(npm|pnpm|yarn|npx|bun|deno)\s+(i|install|ci|add|create|dlx)\b/i.test(cmd) ||
			/\bgo\s+(install|mod)\b/i.test(cmd) ||
			/\b(cargo|rustup)\s+(add|install)\b/i.test(cmd) ||
			/\b(pip|pipx|uv|poetry)\s+(install|add)\b/i.test(cmd) ||
			/\b(bundle|gem)\s+install\b/i.test(cmd),
	},
	{
		reason:
			"Fog mode (/wayfinder) blocks bash-based file mutation (sed -i, output redirects, cp/mv/tee/dd/install/truncate) — in fog mode, file writes go through the write/edit tools. Run `/wayfinder off` first.",
		match: (cmd) =>
			/\b(sed|perl|ruby)\b[^|]*\s(-i\b|--in-place\b)/i.test(cmd) ||
			/\bawk\b[^|]*(-i\s+inplace|--in-place)/i.test(cmd) ||
			/(^|[^\d>])>>?(?![>&])\s*(?!\/dev\/null\b)\S/i.test(cmd) ||
			/\b(cp|mv|install|tee|truncate)\b/i.test(cmd) ||
			/\bdd\b[^|]*\bof\s*=/i.test(cmd),
	},
];

function firstMatch(rules: DenyRule[], value: string): string | undefined {
	if (!value) return undefined;
	return rules.find((rule) => rule.match(value))?.reason;
}

// ---------------------------------------------------------------------------
// Agents — copy the two bundled reviewers to the user agent dir on install.
// ---------------------------------------------------------------------------

function ensureAgentsInstalled(): void {
	const sourceDir = path.resolve(__dirname, "..", "agents");
	const targetDir = path.join(getAgentDir(), "agents");

	if (!fs.existsSync(sourceDir)) {
		console.warn("[wayfinder-guard] agents/ not found at", sourceDir);
		return;
	}

	if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

	let copiedCount = 0;
	const skipped: string[] = [];
	for (const entry of fs.readdirSync(sourceDir)) {
		if (!entry.endsWith(".md")) continue;
		const src = path.join(sourceDir, entry);
		const dst = path.join(targetDir, entry);
		// Don't overwrite a user's existing copy — it may be a deliberate edit.
		if (fs.existsSync(dst)) {
			skipped.push(entry);
			continue;
		}
		fs.copyFileSync(src, dst);
		copiedCount++;
	}

	if (copiedCount > 0)
		console.log(`[wayfinder-guard] Installed ${copiedCount} agent(s) to ${targetDir}`);
	if (skipped.length > 0)
		console.warn(
			`[wayfinder-guard] ${skipped.length} bundled agent(s) already present and left unchanged: ${skipped.join(", ")}. Delete them from ${targetDir} to pick up this extension's versions.`,
		);
}

// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	ensureAgentsInstalled();
	registerSubagentTool(pi);

	// --- Fog mode toggle --------------------------------------------------
	pi.registerCommand("wayfinder", {
		description:
			"Toggle fog mode — enforce no implementation (exploration/wayfinder only). Usage: /wayfinder [on|off]",
		handler: async (args, ctx) => {
			const arg = (args ?? "").trim().toLowerCase();
			if (arg === "off") fogMode = false;
			else if (arg === "on") fogMode = true;
			else fogMode = !fogMode; // bare /wayfinder toggles

			ctx.ui.notify(
				fogMode
					? "Fog mode ON — no implementation. Explore, grill, plan, write notes/tickets/CONTEXT/ADRs only. (/wayfinder off to exit)"
					: "Fog mode OFF — implementation allowed.",
				fogMode ? "warning" : "info",
			);
		},
	});

	// --- Proactive note while fog mode is on ------------------------------
	pi.on("before_agent_start", async (event) => {
		if (!fogMode) return;
		const note =
			"\n\n## Fog mode active (/wayfinder)\n" +
			"You are clearing fog — wayfinder/exploration only. You may explore (read, grep, find, ls) and write *notes, tickets, CONTEXT.md, and ADRs*. " +
			"Do NOT implement: source edits, builds, tests, installs, and commits are blocked. " +
			"Exit fog mode with `/wayfinder off` once a spec exists.";
		return { systemPrompt: event.systemPrompt + note };
	});

	// --- Hard block on implementation actions -----------------------------
	pi.on("tool_call", async (event) => {
		if (!fogMode) return;

		if (isToolCallEventType("write", event)) {
			const reason = firstMatch(FOG_DENY_PATHS, event.input.path);
			if (reason) return { block: true, reason };
		} else if (isToolCallEventType("edit", event)) {
			const reason = firstMatch(FOG_DENY_PATHS, event.input.path);
			if (reason) return { block: true, reason };
		} else if (isToolCallEventType("bash", event)) {
			const reason = firstMatch(FOG_DENY_COMMANDS, event.input.command);
			if (reason) return { block: true, reason };
		}
	});
}