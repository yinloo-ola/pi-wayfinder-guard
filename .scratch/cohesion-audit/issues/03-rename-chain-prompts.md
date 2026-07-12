---
Type: task
Status: resolved
Blocked by:
---
# Rename the three chain prompts to a consistent `-chain` suffix

## Question

Three prompts are agent-chain workflows that collide with same-named skills or use inconsistent naming. What convention disambiguates them?

## Decision (from grilling)

Adopt one rule: **`/foo` = the skill (the agent does it directly); `/foo-chain` = a prompt that delegates to an agent chain.** Rename all three to a consistent `-chain` suffix naming the agent sequence.

## Work

Rename on disk (git mv), and update the `description` frontmatter only if needed for clarity — do not rewrite the chain bodies:

- `prompts/implement.md` → `prompts/implement-chain.md` (scout → planner → implementer)
- `prompts/implement-and-review.md` → `prompts/implement-review-chain.md` (implementer → reviewer)
- `prompts/scout-and-plan.md` → `prompts/scout-plan-chain.md` (scout → planner, no implement)

## Constraints

- Do not touch the skills (`skills/implement/` etc.) — only the prompts.
- This ticket does **not** update the README prompt table — that's ticket 05 (P3), which depends on this and ticket 02 landing first.
- The `/code-review` prompt is handled separately in ticket 02 (deleted, not renamed).

## Done when

- The three files exist only under their new `-chain` names; old names are gone.
- No prompt shares a name with a skill.
- The four prompts total are now: `implement-chain`, `implement-review-chain`, `scout-plan-chain` (and `code-review` deleted by ticket 02).

## Answer

**Done.** All three chain prompts renamed to a consistent `-chain` suffix, staged as git renames (no content change):

| old | new |
|---|---|
| `prompts/implement.md` | `prompts/implement-chain.md` |
| `prompts/implement-and-review.md` | `prompts/implement-review-chain.md` |
| `prompts/scout-and-plan.md` | `prompts/scout-plan-chain.md` |

`git status --short prompts/` confirms three `R` (rename) entries plus the `D` for `code-review.md` from ticket 02.

- **Bodies untouched** — only filenames changed (per "do not rewrite the chain bodies").
- **Descriptions left unchanged** — they're still accurate and clear; the `-chain` suffix makes the naming rule self-documenting. No clarity edit was needed.
- **No collisions** — none of the three new base-names (`implement-chain`, `implement-review-chain`, `scout-plan-chain`) matches a skill directory.

**README is now stale, and deliberately so** — per constraints, the README is _Document the end-to-end workflow_'s (05) job. Precise cleanup list for 05:
- The `### 4 workflow prompts` table still lists `code-review`, `implement-and-review`, `scout-and-plan`, `implement`. Post-rename reality is **3 prompts**: `implement-chain`, `implement-review-chain`, `scout-plan-chain`; `/code-review` is now the **skill** (no prompt).
- `code-review` appears 4× in README, `implement-and-review` 1×, `scout-and-plan` 1×, and bare `implement` in the prompts table + Usage examples.
- The heading itself (`4 workflow prompts`) needs to drop to 3.

**Frontier consequence:** 05 was blocked by 02 + 03 — both now resolved — so **05 is now unblocked** and joins the frontier alongside 04. _Keep `UPSTREAM-CHANGES.md` honest_ (07) is still blocked by 04. No fog graduated.