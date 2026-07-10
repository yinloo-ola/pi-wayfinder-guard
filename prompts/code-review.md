---
description: Two-axis code review — Standards (code quality) and Spec (requirements) in parallel
---
Run a two-axis code review using the subagent tool with the **parallel** parameter.

First specify the review scope. Ask the user for the fixed point (commit SHA, branch, tag, or `HEAD~N`) if they haven't provided one. Confirm it resolves with `git rev-parse`.

Then identify the spec source: check commit messages for issue references, check for PRD/spec files under `docs/`, `specs/`, or `.scratch/`, or ask the user.

Standards sources: check for `CODING_STANDARDS.md`, `CONTRIBUTING.md`, or any `.cursorrules`/`.clinerules` files in the repo.

Then run **parallel** subagent tasks:

1. First task — agent: `standards-reviewer`
   Task: "Review the diff <fixed-point>...HEAD against these standards sources: <list of files>. Apply the smell baseline. Report violations per file/hunk."
2. Second task — agent: `spec-reviewer`
   Task: "Review the diff <fixed-point>...HEAD against this spec: <spec path or content>. Report missing requirements, scope creep, and implementation concerns."

Present the results under **## Standards** and **## Spec** headings. Do NOT merge or rerank — keep the two axes separate. End with a one-line summary: total findings per axis and the worst issue in each.