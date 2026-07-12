---
Type: task
Status: resolved
Blocked by:
---
# Resolve `/code-review` skill-vs-prompt collision

## Question

`/code-review` is both a skill (`skills/code-review/SKILL.md`) and a prompt (`prompts/code-review.md`), and they contradict: the skill spawns two `general-purpose` sub-agents; the prompt spawns `standards-reviewer` + `spec-reviewer`. Which wins, and what's the single canonical `/code-review`?

## Decision (from grilling)

The skill is the richer artifact; the prompt's one good idea is using the dedicated agents. **Delete the prompt; keep the skill as the single canonical `/code-review`; change the skill to use `standards-reviewer` + `spec-reviewer` instead of `general-purpose`.**

## Work

1. Delete `prompts/code-review.md`.
2. In `skills/code-review/SKILL.md`, step 4 ("Spawn both sub-agents in parallel"):
   - Replace "Use the `general-purpose` subagent for both." with guidance to use the `standards-reviewer` agent for the Standards sub-agent and the `spec-reviewer` agent for the Spec sub-agent.
   - Adjust the two sub-agent briefs to name the dedicated agent rather than `general-purpose`.
3. Leave the rest of the skill (smell baseline, aggregation, "Why two axes") unchanged.

## Constraints

- Do not touch the 12-smell baseline — that's the skill's value.
- This ticket does **not** update the README prompt table — that's ticket 05 (P3), which depends on this and ticket 03 landing first.

## Done when

- `prompts/code-review.md` no longer exists.
- `skills/code-review/SKILL.md` references `standards-reviewer` and `spec-reviewer`, not `general-purpose`.
- Only one `/code-review` command exists in the extension.

## Answer

**Done.** The collision is resolved — `/code-review` is now a single canonical command (the skill), using the dedicated review agents.

- **Deleted** `prompts/code-review.md` (`git rm`'d, staged). The three other prompts are untouched.
- **Rewired the skill** (`skills/code-review/SKILL.md`, step 4) — three minimal edits, all naming the dedicated agents:
  - Intro line: `Use the general-purpose subagent for both.` → `the standards-reviewer subagent for the Standards review and the spec-reviewer subagent for the Spec review.`
  - `**Standards sub-agent prompt**` → `**Standards sub-agent prompt** (run as standards-reviewer)`
  - `**Spec sub-agent prompt**` → `**Spec sub-agent prompt** (run as spec-reviewer)`
- **Left untouched** (per constraints): the 12-smell baseline, the aggregation step, and the "Why two axes" section. No README change (that's _Document the end-to-end workflow_, 05).

Done-when verified: prompt gone; skill references `standards-reviewer` + `spec-reviewer`; no `general-purpose` remains; exactly one `/code-review` command.

**This is the extension's intentional divergence from upstream** — `general-purpose` → dedicated two-axis agents. It's a real delta for _Keep `UPSTREAM-CHANGES.md` honest_ (07) to record in Batch 2 (the skill now differs from `d574778`). No fog graduated; nothing newly unblocked (05 still waits on 03; 07 still waits on 03 and 04).