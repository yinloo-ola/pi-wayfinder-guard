import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

import registerSubagentTool from "./subagent/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureAgentsInstalled(): void {
	const sourceDir = path.resolve(__dirname, "..", "agents");
	const targetDir = path.join(getAgentDir(), "agents");

	if (!fs.existsSync(sourceDir)) {
		console.warn("[matt-pocock-skills] agents/ not found at", sourceDir);
		return;
	}

	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	let copiedCount = 0;
	for (const entry of fs.readdirSync(sourceDir)) {
		if (!entry.endsWith(".md")) continue;
		const src = path.join(sourceDir, entry);
		const dst = path.join(targetDir, entry);

		// Skip if the user already has a copy (don't overwrite customizations)
		if (fs.existsSync(dst)) continue;

		fs.copyFileSync(src, dst);
		copiedCount++;
	}

	// Only log on first install
	if (copiedCount > 0) {
		console.log(
			`[matt-pocock-skills] Installed ${copiedCount} agent(s) to ${targetDir}`,
		);
	}
}

export default function (pi: ExtensionAPI) {
	// Install bundled agents to user-level agent directory
	ensureAgentsInstalled();

	// Register the subagent tool (vendored from pi's examples)
	registerSubagentTool(pi);

	// Skills are auto-discovered by pi from the skills/ directory at package root.
	// No explicit registration needed — pi scans skills/ for SKILL.md files
	// during package discovery.
}