# Changelog

## 0.2.1 (2026-07-12)

Default-entry fix + cohesion polish — the extension now owns its own `/grill-with-docs`.

### Added

- **`grill-with-docs` skill** (12th skill) — the documented default entry to the v1.1 lifecycle, restored verbatim from `mattpocock/skills` @ `d574778`. Without it, sessions fell back to a foreign copy and the README lifecycle diverged from the video narrative.
- **`scripts/check.mjs`** — static sanity checks (`npm run check`): SKILL.md frontmatter parses, companion refs resolve, skill-count consistent across README/NOTICE/tree, every file ships via `npm pack`. Catches the regressions that previously bit this repo.

### Changed

- **README lifecycle** — `/grill-with-docs` is now the default entry (was bare `/grilling`). The diagram, skill table, and supporting-skills section updated; `/grilling` reframed as the core primitive both `/grill-with-docs` and wayfinder's grilling tickets build on. `/domain-modeling` is now documented as captured automatically by `/grill-with-docs`.
- **`ensureAgentsInstalled()`** — now warns when bundled agents are already present (previously silently skipped, leaving no trail when a stale customization shadowed a bundled agent). Fires on partial installs too.
- **NOTICE / UPSTREAM-CHANGES** — account for the 12th skill (Batch 3 delta record).

## 0.2.0 (2026-07-12)

Cohesion audit — the extension is now a coherent, honest derivative of `mattpocock/skills` @ `d574778`.

### Changed (breaking)

- **Prompt renames** to a consistent `-chain` suffix: `/implement-and-review` → `/implement-review-chain`, `/scout-and-plan` → `/scout-plan-chain`, `/implement` (prompt) → `/implement-chain`. Rule: `/foo` is a skill, `/foo-chain` is a sub-agent-delegating prompt.
- **`/code-review` is a skill only** — the colliding prompt is removed; the skill now uses the dedicated `standards-reviewer` + `spec-reviewer` agents (was `general-purpose`).
- **`/implement-review-chain` now runs the full two-axis review** (parallel `standards-reviewer` + `spec-reviewer`), not a generic reviewer pass.
- **Generic `reviewer` agent removed** (6 → 5 agents); nothing invoked it after the chain upgrade.

### Added

- **11 skill companion files** restored verbatim (issue-tracker templates, triage-labels, domain, CONTEXT/ADR formats, prototype LOGIC/UI, tdd tests/mocking) — now shipped via `npm pack`.
- **README `## Workflow` section** — lifecycle diagram, supporting skills, prompt chains, HITL↔AFK ranking.
- **`UPSTREAM-CHANGES.md` Batch 2** — records every post-derivation delta.

### Fixed

- Rephrased 7 `disable-model-invocation` slash-references to address the user, not the model (`implement`, `to-tickets`, `wayfinder`).
- `NOTICE` now lists all derived companion files.

## 0.1.0 (2026-07-10)

Initial release.

### Features

- **11 skills** from mattpocock/skills @ `d574778`: wayfinder, to-spec, to-tickets, implement, code-review, research, prototype, grilling, domain-modeling, tdd, setup-matt-pocock-skills
- **Subagent tool** — vendored from `@earendil-works/pi-coding-agent` v0.80.6, supports single, parallel, and chain delegation modes
- **6 agent definitions** — implementer, planner, reviewer, scout, standards-reviewer, spec-reviewer
- **4 workflow prompts** — code-review, implement-and-review, scout-and-plan, implement
- **Auto-install** — bundled agents are copied to `~/.pi/agent/agents/` on first extension load