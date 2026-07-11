# pi-matt-pocock-skills

> Matt Pocock's engineering skills, bundled as a pi extension with parallel sub-agent support.

This extension is derived from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT). It is a derivative work — not created by or endorsed by Matt Pocock.

## Installation

```bash
pi install npm:pi-matt-pocock-skills
```

After installing, restart pi to pick up the extension and bundled skills.

## What's included

### 11 skills

All skills from Matt Pocock's v1.1 engineering flow, ported verbatim with MIT attribution:

| Skill | Description |
|-------|-------------|
| `wayfinder` | Plan a large effort as a shared map of investigation tickets |
| `to-spec` | Turn the current conversation into a published spec |
| `to-tickets` | Break a spec into tracer-bullet tickets |
| `implement` | Implement a ticket with TDD |
| `code-review` | Two-axis review (Standards + Spec) via parallel sub-agents |
| `research` | Investigate a question against primary sources |
| `prototype` | Build a throwaway prototype to answer a design question |
| `grilling` | Stress-test a plan through structured question-and-answer |
| `domain-modeling` | Build and sharpen the project's domain vocabulary |
| `tdd` | Test-driven development reference |
| `setup-matt-pocock-skills` | Configure a repo for the engineering skills |

### Subagent tool

A vendored copy of pi's `subagent` tool (from pi v0.80.6 @ `34582ef`), registered automatically. Supports single, parallel, and chain modes for delegating tasks to specialized sub-agents.

### 6 agent definitions

| Agent | Purpose | Tools |
|-------|---------|-------|
| `standards-reviewer` | Checks code against documented standards + code smell baseline | read, grep, find, ls, bash |
| `spec-reviewer` | Checks code against the originating spec/issue/PRD | read, grep, find, ls, bash |
| `implementer` | Full-stack implementation with TDD | default |
| `reviewer` | Read-only code review with per-file issue reporting | read, grep, find, ls, bash |
| `scout` | Fast codebase recon producing structured findings for handoff | read, grep, find, ls, bash |
| `planner` | Produces concrete implementation plans from context | read, grep, find, ls |

### 4 workflow prompts

| Prompt | Flow |
|--------|------|
| `code-review` | Parallel Standards + Spec reviewers → parent merges results |
| `implement-and-review` | Chain: implementer → reviewer |
| `scout-and-plan` | Chain: scout → planner (plan only, no implementation) |
| `implement` | Chain: scout → planner → implementer |

## Usage

```bash
# Start a wayfinding session
/wayfinder

# Review code since a branch or commit
/code-review

# Break a conversation into a spec
/to-spec

# Break a spec into tickets
/to-tickets

# Implement a ticket with TDD
/implement

# Research a question in the background
/research

# Grill a plan before building
/grilling
```

The workflow prompts (`/code-review`, `/implement`, etc.) use the `subagent` tool internally. Bundled agent definitions are installed automatically on first load — no manual setup needed.

### Repo configuration

Run `/setup-matt-pocock-skills` in any repo to configure the issue tracker, triage labels, and domain docs that the engineering skills consume.

## Attribution

The 11 skills are derived from [mattpocock/skills](https://github.com/mattpocock/skills) @ `d574778`, licensed under MIT (Copyright 2026 Matt Pocock). Each SKILL.md carries a per-file attribution header, and the `NOTICE` file lists all derived files. See `UPSTREAM-CHANGES.md` for the delta record.

The `subagent` tool (`src/subagent/`) is vendored from `@earendil-works/pi-coding-agent` v0.80.6 @ `34582ef`, licensed under MIT (Copyright 2026 earendil-works). See `src/subagent/UPSTREAM.md` for details.

## License

MIT — see [LICENSE](./LICENSE).