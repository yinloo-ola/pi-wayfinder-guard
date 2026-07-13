---
description: Parallel four-axis code review (Standards, Spec + Traceability, Security, Optimization) against the current diff
argument-hint: "[fixed-point]"
---
Run a **four-axis code review** of the current changes using the subagent tool in **parallel** mode.

The fixed-point is `${1:-HEAD}` — pass a commit/branch/tag (e.g. `/review main`), or omit to review the working tree against `HEAD`.

Use the subagent tool with the `tasks` parameter (parallel mode), each pointed at the diff `git diff ${1:-HEAD}`:

```
tasks:
  - agent: standards-reviewer
    task: "Review the diff `git diff ${1:-HEAD}` against any documented coding standards in the repo, plus the Fowler smell baseline."
  - agent: spec-reviewer
    task: "Review the diff `git diff ${1:-HEAD}` against the spec or ticket this work implements. Report missing requirements, scope creep, implementation concerns, and trace every entry point's call chain for seam breaks and round-trip proof."
  - agent: security-reviewer
    task: "Review the diff `git diff ${1:-HEAD}` for security vulnerabilities and production hazards. Assume a hostile world."
  - agent: optimization-reviewer
    task: "Review the diff `git diff ${1:-HEAD}` for optimization issues. Scale to 100x and check for silent errors."
```

Present the four reports under **## Standards**, **## Spec**, **## Security**, and **## Optimization** headings, unmerged and unranked. End with a one-line summary: total findings per axis and the worst issue in each.