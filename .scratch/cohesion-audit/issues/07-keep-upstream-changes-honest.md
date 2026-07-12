---
Type: task
Status: resolved
Blocked by: 02, 03, 04
---
# Keep `UPSTREAM-CHANGES.md` honest after the deltas

## Question

`UPSTREAM-CHANGES.md` currently records only "Batch 1: verbatim copy + attribution header" for all 11 skills, plus a note that `disable-model-invocation` is preserved verbatim. But three tickets in this map introduce real deltas from upstream `d574778`. The delta record will be stale — and for a derivative work, a stale delta record is an attribution integrity bug. What needs recording, and how?

## Decision (from charting)

Record a **Batch 2** section in `UPSTREAM-CHANGES.md` that lists every file changed beyond the verbatim copy, each with the upstream path, the nature of the delta, and the *why* (the extension's reason for diverging). One coherent pass after 02/03/04 land, not three scattered edits — the delta record is a single artifact and reads best as a single batch.

## Work

Add a `## Batch 2: Post-derivation deltas (2026-07-12)` section to `UPSTREAM-CHANGES.md` covering, at minimum:

- **`skills/code-review/SKILL.md`** (from 02) — step 4 changed `general-purpose` → `standards-reviewer` (Standards sub-agent) + `spec-reviewer` (Spec sub-agent), and the two sub-agent briefs rephrased to name the dedicated agents. *Why:* this extension bundles dedicated review agents; that is its value-add over upstream's generic sub-agent. Flag this as the **intentional divergence**, not a bug.
- **`prompts/`** (from 03) — `implement.md`, `implement-and-review.md`, `scout-and-plan.md` renamed to `implement-chain.md`, `implement-review-chain.md`, `scout-plan-chain.md`; `code-review.md` deleted (from 02). These are extension-added chain prompts, not upstream artifacts — record them as such (they have no upstream path).
- **`skills/implement/SKILL.md`, `skills/to-tickets/SKILL.md`, `skills/wayfinder/SKILL.md`** (from 04) — slash-references rephrased from model-addressed to user-addressed to respect `disable-model-invocation: true`. *Why:* semantic correctness under pi's invocation model. Note each is a minimum-rewrite (phrasing only), not a content change.

Also: if any of these deltas make the existing "Batch 1" row for the affected skill slightly inaccurate (it says "verbatim"), leave Batch 1 as the historical record of the *initial* derivation and let Batch 2 carry the deltas — do not rewrite history.

## Constraints

- This ticket records deltas; it does **not** introduce new ones. If you find yourself editing skill/prompt content to "fix" something while in here, stop — that's a different ticket.
- Do not touch `NOTICE` (that lists derived files, unchanged by these deltas) unless a file was genuinely added/removed (the renamed prompts are renames, not additions).
- Minimum-rewrite the prose; mirror the table format Batch 1 already uses.

## Done when

- `UPSTREAM-CHANGES.md` has a Batch 2 section listing every file touched by 02, 03, and 04 with upstream path (or "extension-added"), the delta, and the why.
- The delta record matches what's actually on disk — no claim of "verbatim" survives where a delta now exists, without a Batch 2 pointer next to it.
- A reader scanning `UPSTREAM-CHANGES.md` can tell, per file, exactly how this repo's copy differs from `mattpocock/skills` @ `d574778`.

## Answer

**Done.** Appended a `## Batch 2: Post-derivation deltas (2026-07-12)` section to `UPSTREAM-CHANGES.md` — Batch 1 left intact as the historical initial-derivation record.

Batch 2 has three parts:
1. **Skill edits** (table: File | Upstream path | Delta beyond Batch 1 | Why) — the 4 upstream-derived `SKILL.md` files modified by 02 (`code-review`: `general-purpose`→dedicated agents, flagged as the **intentional divergence**) and 04 (`implement`, `to-tickets`, `wayfinder`: slash-refs rephrased under `disable-model-invocation`). Plus a note that the flag itself is unchanged — Batch 1's note stands.
2. **Prompt templates** (extension-added, no upstream path) — the 3 renames from 03 + the deletion from 02.
3. **Restored verbatim (no delta)** — the 11 companion files from 01, noted for completeness so the record accounts for every file under `skills/`.

**Verification — git cross-check:** `git diff --name-only HEAD -- 'skills/*/SKILL.md'` returns exactly `code-review`, `implement`, `to-tickets`, `wayfinder` — the precise set Batch 2's skill-edits table claims. No modified upstream-derived file is missing; no non-upstream file (`NOTICE`, `README`) is mis-listed as a delta. `prompts/` renames + deletion all covered.

**Constraints honoured:** Batch 1 not rewritten (appended only); `NOTICE` not edited (only referenced); prose mirrors Batch 1's table format; **link-free** — `.scratch/` isn't in `package.json` `files`, so links to internal tickets would break in the published package; the audit is referenced as plain text (`.scratch/cohesion-audit/`) instead.

No fog graduated; nothing newly unblocked. This was the last task ticket — the only open ticket left is _Align the implement-review chain's review step_ (08), a **grilling** (HITL) decision that needs the user.

## Why this is blocked by 02, 03, and 04

The deltas can only be recorded accurately once the three tickets that introduce them have landed. Recording them earlier would describe changes that don't exist yet; recording them later means the delta record is temporarily dishonest between merges.