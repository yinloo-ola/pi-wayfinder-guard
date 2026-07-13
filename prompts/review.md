---
description: Parallel two-axis code review (Standards + Spec) against the current diff
argument-hint: "[fixed-point]"
---
Run a **two-axis code review** of the current changes using the subagent tool in **parallel** mode.

The fixed-point is `${1:-HEAD}` — pass a commit/branch/tag (e.g. `/review main`), or omit to review the working tree against `HEAD`.

Use the subagent tool (**parallel** mode) with two tasks, each pointed at the diff `git diff ${1:-HEAD}`:

1. agent: **standards-reviewer** — "Review the diff `git diff ${1:-HEAD}` against any documented coding standards in the repo, plus the smell baseline."
2. agent: **spec-reviewer** — "Review the diff `git diff ${1:-HEAD}` against the spec or ticket this work implements. Report missing requirements, scope creep, and implementation concerns."

Present the two reports under **## Standards** and **## Spec** headings, unmerged and unranked. End with a one-line summary: total findings per axis and the worst issue in each.