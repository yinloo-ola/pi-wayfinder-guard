import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	getAgentDir,
	isToolCallEventType,
	parseSkillBlock,
} from "@earendil-works/pi-coding-agent";

import registerSubagentTool from "./subagent/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Fog guard — enforce "no implementation during the wayfinder phase".
//
// Wayfinder is for clearing fog: explore, grill, plan, and write notes,
// tickets, CONTEXT.md, and ADRs. Implementation (source edits, builds,
// commits) belongs to the later spec → tickets → implement → review phases.
//
// DESIGN: fog state is DERIVED from the active skill, not toggled by a
// command. The guard observes skill transitions:
//   - `/skill:wayfinder` (or any skill in FOG_ON_SKILLS)  → fog ON
//   - `/skill:implement` (or any skill in FOG_OFF_SKILLS) → fog OFF
//   - any other skill, or a non-skill message              → fog unchanged
// This removes the need for a `/wayfinder` command entirely and eliminates
// the cross-extension toggle problem (see docs/adr/0002-fog-mode-toggle-seam.md).
// A manual `/fog on|off|auto` override remains for escape-hatch use; it sets
// a sticky flag the observers respect until the next `/fog` call. `/fog auto`
// clears the override so skill transitions resume driving fog state.
//
// Detection uses pi's own `parseSkillBlock` on the finalized user message
// (`message_start` event), so it sees the skill no matter how it entered the
// conversation. On session resume, the `context` event back-computes the
// initial state by scanning the transcript for the most recent skill block.
//
// The fog note is wrapped in delimiters so `before_agent_start` can strip
// it cleanly when fog is off, instead of leaving it lingering in the model's
// visible context.
// ---------------------------------------------------------------------------

const FOG_NOTE_DELIMITER_START = "<!-- wayfinder-guard:fog-note -->";
const FOG_NOTE_DELIMITER_END = "<!-- /wayfinder-guard:fog-note -->";

/** Skill names that turn fog ON when they become active. */
const FOG_ON_SKILLS = new Set(["wayfinder"]);
/** Skill names that turn fog OFF when they become active. */
const FOG_OFF_SKILLS = new Set(["implement"]);

/**
 * Derived fog state. Mutated only via `applyFogState` so transitions always
 * fire the same side effects (notify + reminder message).
 */
let fogMode = false;
/**
 * Sticky manual override. When non-null, skill transitions are ignored and
 * fog stays at this value until the user clears it with `/fog auto` (which
 * sets this back to null so skill transitions resume driving fog).
 */
let fogOverride: boolean | null = null;

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
			"Fog mode blocks source-code edits — wayfinder is for clearing fog, not implementing. Run `/skill:implement` (or `/fog off`) once you have a spec.",
		match: (p) =>
			/\.(ts|tsx|js|jsx|mjs|cjs|go|py|pyi|rs|java|kt|kts|swift|rb|php|c|h|cc|cpp|hpp|cs|scala|clj|ex|exs|fs|hs|jl|lua|pl|pm|r|sh|bash|sql|vue|svelte|dart|zig|nim)\b/i.test(
				p,
			),
	},
	{
		reason:
			"Fog mode blocks dependency/manifest/config changes — that is implementation. Run `/skill:implement` (or `/fog off`) first.",
		match: (p) =>
			/(^|[\\/])(package\.json|package-lock\.json|tsconfig\.json|jsconfig\.json|go\.mod|go\.sum|cargo\.toml|cargo\.lock|pyproject\.toml|requirements\.txt|pipfile|pipfile\.lock|uv\.lock|poetry\.lock|pom\.xml|build\.gradle|build\.gradle\.kts|gemfile|gemfile\.lock|composer\.json|makefile|cmakelists\.txt)([\\/]|$)/i.test(
				p,
			) ||
			/(^|[\\/])\.env(\.|$)/i.test(p) ||
			/\.lock$/i.test(p),
	},
];

/** Fog note injected into the system prompt while fog mode is active. */
function buildFogNote(): string {
	return (
		"\n\n" +
		FOG_NOTE_DELIMITER_START +
		"\n## Fog mode active (wayfinder phase)\n" +
		"You are clearing fog — wayfinder/exploration only. You may explore (read, grep, find, ls) and write *notes, tickets, CONTEXT.md, and ADRs*. " +
		"Do NOT implement: source edits, builds, tests, installs, and commits are blocked. " +
		"Exit fog mode with `/skill:implement` (or `/fog off`) once a spec exists." +
		"\n" +
		FOG_NOTE_DELIMITER_END
	);
}

/** Remove every fog-note block from a system prompt, leaving base text clean. */
function stripFogNote(systemPrompt: string): string {
	let result = systemPrompt;
	while (true) {
		const start = result.indexOf(FOG_NOTE_DELIMITER_START);
		if (start === -1) break;
		const end = result.indexOf(FOG_NOTE_DELIMITER_END, start);
		if (end === -1) break;
		result =
			result.slice(0, start).trimEnd() +
			"\n\n" +
			result.slice(end + FOG_NOTE_DELIMITER_END.length).trimStart();
	}
	return result.trimEnd();
}

// Running these commands is implementation. Test/build/run are deliberately
// NOT blocked: with source writes blocked (FOG_DENY_PATHS), they can only act
// on existing code — which is exploration (reproduce a bug, read behaviour).
const FOG_DENY_COMMANDS: DenyRule[] = [
	{
		reason:
			"Fog mode blocks git mutations (commit/push/restore/apply/clean/rm/mv/…) — git is off-limits while clearing fog. Run `/skill:implement` (or `/fog off`) first.",
		match: (cmd) =>
			/\bgit\s+(commit|push|tag|cherry-pick|rebase|merge|reset|revert|apply|restore|clean|rm|mv)\b/i.test(cmd),
	},
	{
		reason:
			"Fog mode blocks dependency installs — adding packages is implementation. Run `/skill:implement` (or `/fog off`) first.",
		match: (cmd) =>
			/\b(npm|pnpm|yarn|npx|bun|deno)\s+(i|install|ci|add|create|dlx)\b/i.test(cmd) ||
			/\bgo\s+(install|mod)\b/i.test(cmd) ||
			/\b(cargo|rustup)\s+(add|install)\b/i.test(cmd) ||
			/\b(pip|pipx|uv|poetry)\s+(install|add)\b/i.test(cmd) ||
			/\b(bundle|gem)\s+install\b/i.test(cmd),
	},
	{
		reason:
			"Fog mode blocks bash-based file mutation (sed -i, output redirects, cp/mv/tee/dd/install/truncate) — in fog mode, file writes go through the write/edit tools. Run `/skill:implement` (or `/fog off`) first.",
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

/**
 * Normalize a filesystem path before denylist matching: trim surrounding
 * whitespace (defeats `" package.json"`) and collapse `.`/`..`/redundant
 * separators. Rejects paths containing a NUL or CR (injection attempts) by
 * leaving them unchanged — those still match the source-extension regex and
 * are blocked for the right reason.
 */
function normalizePath(p: string): string {
	const trimmed = (p ?? "").trim();
	if (/[\u0000\r]/.test(trimmed)) return trimmed;
	try {
		return path.normalize(trimmed);
	} catch {
		return trimmed;
	}
}

/**
 * Parse a skill block from an AgentMessage's content, which may be a string
 * or an array of content parts. Skill blocks live in the text. Returns the
 * first part that parses (so a skill block not at offset 0 — e.g. with text
 * preamble — is still detected), or `null` if no part is a skill block.
 */
function parseSkillFromContent(content: unknown): ReturnType<typeof parseSkillBlock> {
	if (typeof content === "string") return parseSkillBlock(content);
	if (!Array.isArray(content)) return null;
	for (const part of content) {
		if (
			typeof part === "object" &&
			part !== null &&
			(part as { type?: string }).type === "text"
		) {
			const parsed = parseSkillBlock(String((part as { text?: string }).text ?? ""));
			if (parsed) return parsed;
		}
	}
	return null;
}

/**
 * Determine the fog state a skill name implies, or `null` if the skill is
 * neutral (neither turns fog on nor off).
 */
function fogStateForSkill(name: string): boolean | null {
	if (FOG_OFF_SKILLS.has(name)) return false;
	if (FOG_ON_SKILLS.has(name)) return true;
	return null;
}

/**
 * Walk a transcript (most-recent last) and return the fog state implied by
 * the most recent skill block, or `null` if no skill block is present.
 */
function fogStateFromMessages(messages: { role?: string; content?: unknown }[]): boolean | null {
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i];
		if (!m || m.role !== "user") continue;
		const parsed = parseSkillFromContent(m.content);
		if (!parsed) continue;
		const state = fogStateForSkill(parsed.name);
		if (state !== null) return state;
	}
	return null;
}

/**
 * Apply a new fog state, firing transition side effects (notify + hidden
 * reminder) only on actual on↔off transitions. Safe to call with the same
 * value repeatedly (no-op).
 */
function applyFogState(next: boolean, pi: ExtensionAPI, notify: (msg: string) => void): void {
	const was = fogMode;
	if (next === was) return;
	fogMode = next;
	// Hidden reminder so the model's verbal behaviour flips with the toggle.
	pi.sendMessage({
		customType: "wayfinder-guard:reminder",
		content: next
			? "Fog mode is now ON (wayfinder phase). Exploration and planning only — do not edit source files, update manifests/config, install dependencies, or perform git mutations."
			: "Fog mode is now OFF (implement phase). You may implement: edit source files, update manifests, run installs, and perform git mutations as requested.",
		display: false,
	});
	notify(
		next
			? "Fog mode ON — no implementation. Explore, grill, plan, write notes/tickets/CONTEXT/ADRs only."
			: "Fog mode OFF — implementation allowed.",
	);
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

	const notify = (msg: string) => {
		// ctx.ui.notify lives on command/event contexts, not on `pi`. For event
		// handlers we don't have one handy, so route through a custom message
		// the user can see. Command handlers use their own ctx.ui.notify.
		pi.sendMessage({
			customType: "wayfinder-guard:status",
			content: msg,
			display: true,
		});
	};

	// --- Manual override (escape hatch) -----------------------------------
	// Fog state is derived from skills, so there is no `/wayfinder` toggle.
	// `/fog on|off` pins fog to the given value and ignores skill transitions
	// until the next `/fog` call. `/fog auto` clears the override so skill
	// transitions resume driving fog.
	pi.registerCommand("fog", {
		description:
			"Manual fog-mode override. Usage: /fog on|off|auto — pins fog until the next /fog; `auto` returns control to skill transitions.",
		handler: async (args, ctx) => {
			const arg = (args ?? "").trim().toLowerCase();
			if (arg === "auto") {
				fogOverride = null;
				// Re-enable transcript back-scan so the pre-override skill state is
				// recovered on the next context event instead of waiting for a new
				// /skill: message.
				contextSeeded = false;
				ctx.ui.notify(
					"Fog override cleared — skill transitions drive fog again.",
					"info",
				);
				return;
			}
			if (arg !== "on" && arg !== "off") {
				ctx.ui.notify("Usage: /fog on|off|auto", "info");
				return;
			}
			fogOverride = arg === "on";
			// Pinning must move fogMode too — the tool guard and before_agent_start
			// read fogMode, not fogOverride. applyFogState fires the transition
			// side effects (reminder + notify) on an actual change.
			applyFogState(arg === "on", pi, notify);
			ctx.ui.notify(
				`Fog override: ${arg}. Skill transitions ignored until the next /fog.`,
				arg === "on" ? "warning" : "info",
			);
		},
	});

	// --- Derive fog state from skill transitions --------------------------
	// `message_start` sees the finalized user message, including the expanded
	// `<skill name="...">…</skill>` block pi injects for `/skill:name`. We use
	// pi's own `parseSkillBlock` so we match exactly what the model sees.
	pi.on("message_start", async (event) => {
		if (fogOverride !== null) return; // manual override active
		const msg = event.message as { role?: string; content?: unknown };
		if (msg.role !== "user") return;
		const parsed = parseSkillFromContent(msg.content);
		if (!parsed) return;
		const next = fogStateForSkill(parsed.name);
		if (next === null) return; // neutral skill — leave fog as-is
		applyFogState(next, pi, notify);
	});

	// --- Back-compute fog state on resume / fork --------------------------
	// `message_start` only fires for NEW messages, so a session resumed
	// mid-wayfinder would start with fog off. The `context` event fires every
	// turn and carries the full transcript; on the first turn after (re)start
	// we scan it for the most recent skill block to seed fog state.
	let contextSeeded = false;
	pi.on("context", async (event) => {
		if (contextSeeded || fogOverride !== null) return;
		const derived = fogStateFromMessages(event.messages as { role?: string; content?: unknown }[]);
		if (derived !== null) applyFogState(derived, pi, notify);
		contextSeeded = true; // only seed once; subsequent transitions handled by message_start
	});

	// --- Proactive note while fog mode is on ------------------------------
	pi.on("before_agent_start", async (event) => {
		let systemPrompt = stripFogNote(event.systemPrompt);
		if (fogMode) {
			systemPrompt = systemPrompt + buildFogNote();
		}
		return { systemPrompt };
	});

	// --- Hard block on implementation actions -----------------------------
	pi.on("tool_call", async (event) => {
		if (!fogMode) return;

		if (isToolCallEventType("write", event)) {
			const reason = firstMatch(FOG_DENY_PATHS, normalizePath(event.input.path));
			if (reason) return { block: true, reason };
		} else if (isToolCallEventType("edit", event)) {
			const reason = firstMatch(FOG_DENY_PATHS, normalizePath(event.input.path));
			if (reason) return { block: true, reason };
		} else if (isToolCallEventType("bash", event)) {
			const reason = firstMatch(FOG_DENY_COMMANDS, event.input.command);
			if (reason) return { block: true, reason };
		}
	});
}