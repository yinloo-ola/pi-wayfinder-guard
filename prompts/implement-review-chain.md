---
description: Implement a ticket with TDD, then run the two-axis code review (Standards + Spec)
---
The AFK equivalent of `/implement` then `/code-review`: implement the work, then review it on the two axes — **Standards** and **Spec** — the same review the `/code-review` skill runs.

**Phase 1 — implement.** Use the subagent tool (**single** mode) with the **implementer** agent to implement: $@

**Phase 2 — two-axis review (parallel).** When the implementer finishes and commits, use the subagent tool (**parallel** mode) with two tasks, each pointed at the implementer's diff — the files it lists in its handoff, or `git diff` against the pre-implementation `HEAD`:

1. agent: **standards-reviewer** — "Review this diff against any documented coding standards in the repo, plus the smell baseline."
2. agent: **spec-reviewer** — "Review this diff against the spec/ticket: `$@`. Report missing requirements, scope creep, and implementation concerns."

Present the two reports under **## Standards** and **## Spec** headings, unmerged and unrerranked. End with a one-line summary: total findings per axis and the worst issue in each.

**What this omits vs the manual flow:** the human seam-agreement — the implementer agrees its own TDD seams with no human in the loop, so suit it to well-scoped tickets, not ones with open architectural choices. The review step itself is the **full two-axis** `/code-review`, not a lighter pass.