---
Type: task
Status: resolved
Blocked by: 02, 03
---
# Document the end-to-end workflow in README

## Question

The README lists skills and prompts in tables but never shows how they fit together. What level of workflow documentation does the README need?

## Decision (from grilling)

A **full top-level `## Workflow` section with a diagram**, replacing the current terse `## Usage` examples. Shows the lifecycle, the supporting skills, and the prompt chains, and teaches the `/foo` vs `/foo-chain` naming rule so the tables self-explain.

## Work

Add a `## Workflow` section to `README.md` (replacing the existing `## Usage` block) containing:

1. **The lifecycle, as a diagram** (ASCII or mermaid):
   `/wayfinder` → `/to-spec` → `/to-tickets` → `/implement` → `/code-review`
2. **Supporting skills** callout: `/grilling`, `/research`, `/prototype`, `/domain-modeling`, `/tdd` — one line each on where they slot in.
3. **Prompt chains** callout — reflecting the **renamed** prompts from ticket 03 and the **deleted** `/code-review` prompt from ticket 02:
   - `/scout-plan-chain` — scout → planner (plan only)
   - `/implement-chain` — scout → planner → implementer
   - `/implement-review-chain` — implementer → reviewer (⚠️ the `reviewer` agent is a **generic** read-only review, NOT the two-axis `/code-review`; document this honestly here — [_Align the implement-review chain's review step with two-axis code-review_](08-align-implement-review-chain.md) decides whether to fix it)
4. **The naming rule**, stated once: `/foo` = a skill the agent runs; `/foo-chain` = a prompt that delegates to a sequence of sub-agents.
5. **The HITL↔AFK ranking.** The lifecycle above (the skills) is the canonical flow and is human-in-the-loop. The chain prompts are **optional AFK shortcuts**, not co-equal alternatives. State what each shortcut omits from the canonical flow: `/implement-chain`'s implementer agrees its TDD seams with itself (no human in the loop), so it suits well-scoped tickets rather than ones with open architectural choices; and `/implement-review-chain` currently ends in a generic review (see item 3) rather than the two-axis `/code-review`. The skills are the flow; the chains are for when you want to hand a tidy ticket to sub-agents and step away.

## Constraints

- Update the "4 workflow prompts" table to match the post-rename reality (3 prompts, `-chain` names; `/code-review` is the skill, no prompt).
- Do not duplicate the per-skill descriptions already in the "11 skills" table — the workflow section is about *order and combination*, not re-listing.
- Keep the Installation, Attribution, License sections as-is.
- **The chains are not co-equal with the skills.** The workflow section must rank the HITL skill lifecycle as *the* flow and present the `-chain` prompts as optional AFK shortcuts that omit parts of it (per work item 5). Do not present them as interchangeable alternatives.

## Done when

- README has a `## Workflow` section with the diagram, supporting-skills, prompt-chains, and naming rule.
- The prompt table matches the actual files on disk after tickets 02 + 03.
- No stale `/implement-and-review`, `/scout-and-plan`, or `/code-review` prompt names remain anywhere in the README.
- The HITL lifecycle is clearly ranked above the AFK chains, and the README is honest that `/implement-review-chain`'s `reviewer` step is a generic review, not the two-axis `/code-review` (pending [_Align the implement-review chain's review step_](08-align-implement-review-chain.md)).

## Answer

**Done.** Replaced the terse `## Usage` block with a full `## Workflow` section, and updated the prompts catalog from 4 → 3.

The `## Workflow` section contains, in order:
1. **A setup pointer** — run `/setup-matt-pocock-skills` first (folds in the old "Repo configuration" note, since the workflow depends on the tracker it configures).
2. **The lifecycle as a mermaid diagram** — `/grilling` → `/to-spec` → `/to-tickets` → `/implement` → `/code-review`, with `/wayfinder` branching into `/to-spec` for large efforts.
3. **Supporting skills** — one line each on *where* `/grilling`, `/domain-modeling`, `/research`, `/prototype`, `/tdd` slot in (not re-described — the table does that).
4. **Prompt chains** — the 3 `-chain` prompts in a table with a "What it omits" column carrying the HITL/AFK ranking and the generic-`reviewer` caveat.
5. **The naming rule** — `/foo` = skill; `/foo-chain` = sub-agent-delegating prompt.

The `### 4 workflow prompts` catalog table is now `### 3 workflow prompts` (`scout-plan-chain`, `implement-chain`, `implement-review-chain`), pointing to Workflow for nuance.

**One deviation from the ticket's diagram (flagged):** the ticket specified `/wayfinder → /to-spec → …` as the entry. I corrected it to `/grilling` as the default entry with `/wayfinder` as the large-effort branch. Reason: wayfinder is explicitly for efforts too big for one session — showing it as *the* entry would mislead users into thinking every effort needs a map. The mermaid branch captures the real relationship.

Done-when verified: `## Workflow` present with all five parts; prompt table matches the 3 files on disk; **zero** stale names (`implement-and-review`, `scout-and-plan`, `4 workflow prompts`, `## Usage` all return 0); HITL ranked above AFK; honest about the generic `reviewer`.

**No `UPSTREAM-CHANGES.md` entry needed** — the README is original to this extension, not an upstream artifact, so it's out of _Keep `UPSTREAM-CHANGES.md` honest_'s (07) scope. **Frontier consequence:** this was the sole blocker on _Align the implement-review chain's review step_ (08) — it's now unblocked. But 08 is a **grilling** ticket (HITL): the upgrade-vs-document decision is mine to make in conversation, not the agent's to decide alone.

## Why this is blocked by 02 and 03

The prompt table and the chains callout can only be accurate once `/code-review` is deleted (02) and the three prompts are renamed (03). Charting it earlier would bake in names that are about to change.