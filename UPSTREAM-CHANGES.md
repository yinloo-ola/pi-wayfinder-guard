# UPSTREAM-CHANGES.md

Deltas between our bundled copies and the upstream source at `mattpocock/skills` @ `d574778`.

## Batch 1: All 11 skills (2026-07-10)

### Type of change

Verbatim copy with attribution header prepended.

### Files affected

| Skill | Upstream path | Delta |
|-------|--------------|-------|
| wayfinder | `skills/engineering/wayfinder/SKILL.md` | +3 lines (attribution header) |
| to-spec | `skills/engineering/to-spec/SKILL.md` | +3 lines (attribution header) |
| to-tickets | `skills/engineering/to-tickets/SKILL.md` | +3 lines (attribution header) |
| implement | `skills/engineering/implement/SKILL.md` | +3 lines (attribution header) |
| code-review | `skills/engineering/code-review/SKILL.md` | +3 lines (attribution header) |
| research | `skills/engineering/research/SKILL.md` | +3 lines (attribution header) |
| prototype | `skills/engineering/prototype/SKILL.md` | +3 lines (attribution header) |
| grilling | `skills/productivity/grilling/SKILL.md` | +3 lines (attribution header) |
| domain-modeling | `skills/engineering/domain-modeling/SKILL.md` | +3 lines (attribution header) |
| tdd | `skills/engineering/tdd/SKILL.md` | +3 lines (attribution header) |
| setup-matt-pocock-skills | `skills/engineering/setup-matt-pocock-skills/SKILL.md` | +3 lines (attribution header) |

### Attribution header

```html
<!-- Derived from mattpocock/skills @ d574778, <upstream-path> -->
Copyright (c) 2026 Matt Pocock. Licensed under MIT.
```

### `disable-model-invocation`

Preserved verbatim per upstream. No changes made. Upstream state:
- **Has `disable-model-invocation: true`:** wayfinder, to-spec, to-tickets, implement, setup-matt-pocock-skills
- **No `disable-model-invocation`:** code-review, research, prototype, grilling, domain-modeling, tdd

(The ticket #04 assumption that `disable-model-invocation` should be added to "workflow skills" was inaccurate — the flag is already present in upstream where Matt has set it, and absent where he hasn't. Verbatim preservation is the correct approach for v0.)

## Batch 2: Post-derivation deltas (2026-07-12)

Deltas introduced *after* the Batch 1 verbatim copy, by the cohesion audit tracked in `.scratch/cohesion-audit/` (tickets 02–04). Batch 1 records each skill's *initial* derivation (verbatim + attribution header); for the four skill files below, **read Batch 1 + Batch 2 together** for the current state. Prompt templates and restored companion files are not `SKILL.md` files, so they appear only here.

### Skill edits (upstream-derived files modified beyond the attribution header)

| File | Upstream path | Delta beyond Batch 1 | Why |
|------|---------------|----------------------|-----|
| `skills/code-review/SKILL.md` | `skills/engineering/code-review/SKILL.md` | Step 4: `general-purpose` subagent → `standards-reviewer` (Standards) + `spec-reviewer` (Spec); the two brief headers updated to name each agent. Smell baseline, aggregation, and "Why two axes" untouched. | This extension bundles dedicated two-axis review agents; wiring them into `/code-review` is its value-add over upstream's generic sub-agent. **Intentional divergence, not a bug.** |
| `skills/implement/SKILL.md` | `skills/engineering/implement/SKILL.md` | 2 slash-refs rephrased model→user addressed ("Use /tdd" → "Suggest the user run /tdd"; "use /code-review" → "suggest the user run /code-review"). | `disable-model-invocation: true` — the model can't invoke skills; only the user can. |
| `skills/to-tickets/SKILL.md` | `skills/engineering/to-tickets/SKILL.md` | 1 slash-ref rephrased ("Work the frontier… with `/implement`" → "Suggest the user work the frontier…"). | Same. |
| `skills/wayfinder/SKILL.md` | `skills/engineering/wayfinder/SKILL.md` | 4 slash-refs rephrased to user-addressed (the Chart & Work steps; the Prototype & Grilling Ticket-Type entries tagged "(user-run)"). | Same. |

The `disable-model-invocation` flag itself is **unchanged** on every skill — Batch 1's note stands. These edits rephrased prose *under* the flag; they did not add, remove, or move it.

### Prompt templates (extension-added — no upstream path)

Original to this extension (not derived from `mattpocock/skills`), so no attribution header and no upstream path. Recorded here so the set is fully accounted for:

| File | Status | Flow |
|------|--------|------|
| `prompts/code-review.md` | **deleted** | Collided with the `/code-review` skill; the skill is now the single canonical command. |
| `prompts/implement-chain.md` | renamed from `implement.md` | scout → planner → implementer |
| `prompts/implement-review-chain.md` | renamed from `implement-and-review.md` | implementer → reviewer |
| `prompts/scout-plan-chain.md` | renamed from `scout-and-plan.md` | scout → planner (plan only) |

Renamed to the `-chain` convention: `/foo` = a skill, `/foo-chain` = a sub-agent-delegating prompt. Bodies unchanged by the rename.

### Restored verbatim (no delta)

The 11 companion files referenced by `setup-matt-pocock-skills`, `domain-modeling`, `prototype`, and `tdd` were absent from the initial derivation and **restored verbatim** from `d574778`. Zero delta — copied unchanged, no attribution header (each is covered by its parent skill's header), and listed under "Companion files" in `NOTICE`. Noted here for completeness so the record accounts for every file under `skills/`.