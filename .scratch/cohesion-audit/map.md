# Wayfinder map: pi-matt-pocock-skills cohesion audit

## Destination

Ship the extension as a coherent, honest derivative of `mattpocock/skills` @ `d574778` — companion files present, no command collisions, no `disable-model-invocation` violations, the README teaches the full lifecycle, and `UPSTREAM-CHANGES.md` records every delta from upstream. The map is done when a fresh `pi install` loads cleanly, `npm pack --dry-run` ships every companion file, the README documents the workflow, and the delta record matches the shipped code.

## Notes

- **Upstream pin:** all derived content comes from `mattpocock/skills` @ `d574778`. Companion files are fetched from this exact revision to keep attribution consistent.
- **Issue tracker:** local markdown (see `docs/agents/issue-tracker.md`). This map is `.scratch/cohesion-audit/map.md`; tickets are `.scratch/cohesion-audit/issues/NN-<slug>.md`.
- **Skills every session should consult:** `/wayfinder` (this effort), `/domain-modeling` (glossary lives in `CONTEXT.md` if present), `/tdd` (the Restore-companion-files and Fix-disable-model-invocation tickets touch skill files — keep attribution verbatim, only move/rewrite what the ticket says).
- **Standing preference — keep upstream content verbatim where possible.** Restore-companion-files copies files unchanged; Fix-disable-model-invocation rephrases the minimum needed. Do not "improve" upstream prose while in here.
- **Standing preference — one concern per ticket.** The five open tickets are independent enough to stay separate; do not bundle.
- **The extension's one intentional divergence from upstream** is wiring the bundled review agents (`standards-reviewer`, `spec-reviewer`) into the `code-review` skill in place of upstream's `general-purpose`. That is a design choice the dedicated agents exist for — record it as a delta in `UPSTREAM-CHANGES.md`, not as a bug.
- **The AFK-delegation layer is not part of the canonical flow.** The three `-chain` prompts and the `scout`/`planner`/`implementer` agents (plus `standards-reviewer`/`spec-reviewer`, shared with `/code-review`) are an optional layer for handing tidy tickets to sub-agents. My skills' flow is human-in-the-loop. The chains omit the human seam-agreement by design — the implementer agrees its own TDD seams — so they suit well-scoped tickets, not ones with open architectural choices (use `/implement` for HITL seam-agreement). `/implement-review-chain`'s review step is now the full two-axis `/code-review` (resolved by _Align the implement-review chain's review step_).

## Decisions so far

<!-- the index — one line per closed ticket on the route: enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [Restore 11 missing companion files from upstream](issues/01-restore-companion-files.md) — all 11 fetched verbatim from `d574778`, verified shipping via `npm pack`, every reference resolves; also enumerated them in `NOTICE` (they were unlisted). Verbatim, so no delta for _Keep `UPSTREAM-CHANGES.md` honest_ to record.
- [Resolve the /code-review skill-vs-prompt collision](issues/02-code-review-collision.md) — deleted `prompts/code-review.md`; rewired the skill's step 4 from `general-purpose` to `standards-reviewer` + `spec-reviewer` (smell baseline & aggregation untouched). This is the intentional upstream divergence — a real delta for _Keep `UPSTREAM-CHANGES.md` honest_ (07) to record.
- [Rename the three chain prompts to a consistent -chain suffix](issues/03-rename-chain-prompts.md) — `implement`→`implement-chain`, `implement-and-review`→`implement-review-chain`, `scout-and-plan`→`scout-plan-chain` (git renames, bodies untouched). README still stale — that's _Document the end-to-end workflow_ (05), now unblocked. Prompts are extension-added (no upstream path) — 07 records them as non-upstream artifacts.
- [Fix disable-model-invocation slash-references](issues/04-fix-disable-model-invocation-refs.md) — rephrased 7 model-addressed slash-refs in `implement`, `to-tickets`, `wayfinder` to user-addressed ("Suggest the user run…" / "Have the user run…" / "(user-run)"). Left user-facing fallbacks + descriptives alone. Another real delta for 07. This was the last blocker on 07 — it's now unblocked.
- [Document the end-to-end workflow in README](issues/05-document-workflow.md) — replaced `## Usage` with a full `## Workflow` section (lifecycle mermaid, supporting skills, prompt chains, naming rule, HITL↔AFK ranking); prompts catalog 4→3. Corrected the diagram entry to `/grilling` (default) with `/wayfinder` as the large-effort branch. README is original content, so no delta for 07. This unblocked the grilling ticket 08.
- [Keep UPSTREAM-CHANGES.md honest after the deltas](issues/07-keep-upstream-changes-honest.md) — appended Batch 2 (skill-edits table for the 4 modified `SKILL.md`, prompt-template renames/delete, restored-verbatim note); git cross-check confirmed exact coverage. Batch 1 untouched. Last task ticket — only the HITL grilling 08 remained.
- [Align the implement-review chain's review step with two-axis code-review](issues/08-align-implement-review-chain.md) — **grilling (HITL).** UPGRADE + DROP: rewrote `/implement-review-chain` to two-phase (implementer → parallel `standards-reviewer` + `spec-reviewer`); deleted the generic `reviewer` agent (6→5); repointed the `implementer.md` hint; README rows updated. "Implement then review" now means the real two-axis review. Extension-original changes, so no UPSTREAM-CHANGES delta. Cleared the AFK seam-agreement fog.

## Not yet specified

<!-- Fog discovered during charting. In-scope, but not sharp enough to ticket yet. Graduates as the frontier advances. -->

- **End-to-end integration validation.** After the open tickets land, run the full lifecycle (`/wayfinder` → `/to-spec` → `/to-tickets` → `/implement` → `/code-review`) against this repo (or a scratch repo) and confirm it hangs together as one experience — not just that each piece loads. Not sharp enough to ticket yet: it depends on what actually surfaces when the fixes go live, and the destination's "fresh `pi install` loads clean / `npm pack` ships every file" checks already cover the load-time layer. May graduate into a ticket once the integrity fixes are in.

<!-- _AFK seam-agreement_ fog cleared by the _Document the workflow_ + _Align the implement-review chain_ decisions: the chains are AFK by design (omit human seam-agreement, suit well-scoped tickets); `/implement` is the HITL seam path. Resolved-by-design, zero new tickets. -->

## Out of scope

<!-- Work consciously ruled beyond the destination. Scope, not sharpness, lands it here. Never graduates. -->

- [Add ambient grilling/research drift reminder](issues/06-drift-reminder.md) — **ruled out of *this* cohesion map.** It is a net-new feature (session-history scanning, planning-mode detection, `tool_result` injection, with a known bash gap), not a cohesion fix — so it sits past the destination. It also duplicates, at the tool level, the confirmation gate the `grilling` skill already carries in its own prompt ("do not enact the plan until I confirm we have reached a shared understanding"). Candidate for its **own** wayfinder map, where it earns a grilling ("is the in-skill gate actually insufficient? show me the drift") and a `/prototype` before any task ticket. The full design captured in the closed ticket is raw material for that future effort.