---
Type: grilling
Status: resolved
Blocked by: 05
---
# Align `/implement-review-chain`'s review step with two-axis `/code-review`

## Question

`/implement-review-chain` (the renamed `implement-and-review` prompt) ends its chain with the generic `reviewer` agent — a read-only Critical/Warnings/Suggestions pass with **no two-axis structure and no Fowler smell baseline**. That is a strictly weaker review than my `/code-review` skill, which is the whole point of the code-review work (Standards + Spec, parallel sub-agents, the 12 smells I called "outrageously useful"). So:

**Should "implement then review" mean "implement then *my* review" — i.e. the chain's final step runs `standards-reviewer` + `spec-reviewer` (the two-axis review) instead of the generic `reviewer`? Or is the generic review a deliberately lighter AFK pass that should stay, documented as such?**

## Why this matters

This is the one place the extension silently ships a downgrade of a discipline I explicitly built and praised. A user reaching for `/implement-review-chain` as their "do the work, then check it" loop never sees the two-axis review or the smells — they get a generic senior-reviewer pass. The dedicated `standards-reviewer` and `spec-reviewer` agents already exist (wired into the `/code-review` skill by _Resolve the /code-review skill-vs-prompt collision_); the chain just doesn't use them.

## Context for the decision

- The two-axis review lives in the `code-review` skill and (after _Resolve the /code-review skill-vs-prompt collision_) in the `standards-reviewer` + `spec-reviewer` agents.
- The generic `reviewer` agent is currently used only by this chain.
- `_Document the end-to-end workflow_` (which this is blocked by) will have framed where AFK chains sit relative to the HITL skill flow. That framing determines the bar: if chains are canonical-equivalent, the review must be two-axis; if chains are deliberately-light shortcuts, a generic review may be acceptable *so long as it's labelled as lighter than `/code-review`*.

## Resolution will pick one

1. **Upgrade** — change `/implement-review-chain`'s final step to spawn `standards-reviewer` + `spec-reviewer` in parallel (mirroring `/code-review`), possibly dropping the generic `reviewer` agent if nothing else uses it. "Implement then review" then means the real review.
2. **Keep + document** — leave the generic `reviewer`, but have the README (via _Document the end-to-end workflow_) explicitly label `/implement-review-chain` as a lighter pass that is **not** a substitute for `/code-review`, and say when to reach for each.

Either is defensible. The decision is mine (Matt's) — it's a call about what "review" means in the AFK loop.

## Constraints

- This ticket decides intent; it does not write the README (that's _Document the end-to-end workflow_) or rename anything.
- Whatever is decided, the outcome must make it impossible for a user to accidentally believe `/implement-review-chain` gave them a two-axis review when it didn't.

## Done when

- A grilling session has picked option 1 or option 2 (or a stated hybrid), with the reasoning recorded as the answer.
- The answer is reflected downstream: either the chain prompt is changed (option 1) or the README framing in _Document the end-to-end workflow_ is confirmed against this decision (option 2).

## Why this is blocked by 05

The right resolution depends on how _Document the end-to-end workflow_ frames the chains relative to the canonical HITL flow. Resolving this before that framing lands risks picking "upgrade" when the chains are meant to be deliberately light, or "keep" when they're meant to be canonical-equivalent.

## Answer

**Decision (reached via grilling): UPGRADE the review step to two-axis, and DROP the generic `reviewer` agent.**

"Implement then review" means "implement then *my* review" — the two-axis Standards + Spec with the Fowler smells. Ending an AFK loop on a generic Critical/Warnings/Suggestions pass silently shipped a downgrade of the discipline the extension exists to enforce; the dedicated agents already existed (02 wired them into `/code-review`); and "keep + document as lighter" was redundant with just running `/implement` and skipping `/code-review`. The structural cost (the chain stops being a tidy sequential `chain` and becomes two-phase — implementer, then a parallel spawn) was accepted as worth it.

**Enacted:**
- **Rewrote `prompts/implement-review-chain.md`** to two-phase: Phase 1 `implementer` (single); Phase 2 `standards-reviewer` + `spec-reviewer` in **parallel**, each pointed at the implementer's diff, reports presented under separate `## Standards` / `## Spec` headings (the same shape `/code-review` uses). Leans on the dedicated agents' self-contained smell baseline — no need to paste it.
- **Deleted `agents/reviewer.md`** (`git rm`) — it had no other invoker. README agent table 6 → 5.
- **Repointed `agents/implementer.md`**'s handoff hint from "a reviewer" to "the two-axis reviewers (`standards-reviewer` + `spec-reviewer`)".
- **Updated README** — the catalog row and the workflow "What it omits" row now reflect that the review step *is* the full two-axis `/code-review`; the only remaining omission is the AFK seam-agreement (inherited from `implementer`).

Verified: no stale bare `reviewer` references remain anywhere; 5 agents on disk; both README rows consistent.

**No `UPSTREAM-CHANGES.md` entry** — the chain prompt and the agents are extension-original (not `mattpocock/skills`), so this is outside 07's mattpocock-delta scope; the change is captured in git.

**Fog cleared:** the _AFK seam-agreement_ fog ("Graduates after the workflow and align-review tickets settle") is resolved-by-design — 05 framed the chains as AFK shortcuts that omit human seam-agreement ("suit to well-scoped tickets"), and 08 confirms the review is real, so the design intent is settled: use `/implement` for HITL seam-agreement, use the chains to step away. Clears into zero new tickets. The _end-to-end integration validation_ fog remains as the sole residual signpost.