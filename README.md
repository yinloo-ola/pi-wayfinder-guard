# pi-wayfinder-guard

> A pi extension that enforces **no implementation during wayfinder** (fog mode), plus a **parallel four-axis code review**.

## Why

Matt Pocock's coding flow is `/wayfinder` → `/to-spec` → `/to-tickets` → `/implement` → `/code-review`. Wayfinder is for *clearing fog* — explore, grill, plan, write notes. Implementation belongs to the later phases, after a spec exists. This extension enforces that boundary.

## Install

```bash
pi install npm:pi-wayfinder-guard
```

Restart pi. The two review agents are copied to `~/.pi/agent/agents/` on first load.

## Fog mode

Fog state is **derived from the active skill**, not toggled by a command:

- `/skill:wayfinder` turns fog **ON**.
- `/skill:implement` turns fog **OFF**.
- Any other skill (e.g. `/to-spec`, `/to-tickets`), or a non-skill message, leaves fog **unchanged** — so fog stays on across the whole wayfinder phase until the implement phase begins.
- `/fog on|off|auto` is a **manual override** that pins fog until the next `/fog` call (skill transitions are ignored while pinned). `/fog auto` clears the pin so skill transitions drive fog again. Use it as an escape hatch.

There is no longer a `/wayfinder` toggle command — fog follows the workflow phases automatically. See [`docs/adr/0002-fog-mode-toggle-seam.md`](docs/adr/0002-fog-mode-toggle-seam.md) for why.

On every turn, the extension manages fog-mode context deterministically:

- **System-prompt note** — injected while fog mode is on (so the model knows it's exploring, not implementing), and **actively stripped** when fog turns off. The note is wrapped in delimiters so `before_agent_start` can remove it cleanly instead of leaving it lingering in the model's visible context.
- **Invisible transition reminders** — each on↔off transition emits a hidden message (`wayfinder-guard:reminder`) so the model's verbal behavior flips with the state.
- **Resume / fork** — on the first turn after (re)start, the `context` event back-computes the initial fog state by scanning the transcript for the most recent skill block. So a session resumed mid-wayfinder starts with fog already on.
- **Blocks** implementation actions via a denylist, returning a reason so the model self-corrects:
  - `write`/`edit` to **source files** (`*.ts`, `*.go`, `*.py`, …) and **manifests/config** (`package.json`, `go.mod`, `Cargo.toml`, `*.lock`, `.env`, …).
  - `bash` commands that **mutate files or ship**: git mutations (`commit`, `push`, `restore`, `apply`, `clean`, …), dependency installs (`npm install`, `pip install`, `go mod`, …), and bash-based file writes (`sed -i`, `> file`, `cp`/`mv`/`tee`/`dd …`).

Read-only exploration (read, grep, find, ls, `git diff`), writing notes/tickets/`CONTEXT.md`/ADRs (`.md`), and **running tests/builds** (`npm test`, `go test`, `pytest`) stay allowed — with source writes blocked, they only touch existing code.

### Extending the denylist

The rules live in `src/extension.ts` as two arrays — `FOG_DENY_PATHS` and `FOG_DENY_COMMANDS`. Each entry is `{ reason, match }`. Add your stack's file types or commands; the `reason` is what the model sees when blocked.

## Parallel code review

`/code-review [fixed-point]` runs a **four-axis review** in parallel using the subagent tool:

- **standards-reviewer** — the diff against documented standards + a Fowler code-smell baseline.
- **spec-reviewer** — the diff against the originating spec/ticket: missing requirements, scope creep, implementation concerns, and traces every entry point's call chain for seam breaks and round-trip proof.
- **security-reviewer** — the diff for security vulnerabilities and production hazards, assuming a hostile world.
- **optimization-reviewer** — the diff for optimization issues, scaled to 100x and checked for silent errors.

Omit the fixed-point to review the working tree against `HEAD`, or pass a ref (`/code-review main`). The four reports come back under **## Standards**, **## Spec**, **## Security**, and **## Optimization**.

## What's included

- **Skill-derived fog mode** + `/fog` manual override (`src/extension.ts`).
- **`subagent` tool** — vendored from `@earendil-works/pi-coding-agent` v0.80.6 (single/parallel/chain delegation). See `src/subagent/UPSTREAM.md`.
- **4 agents** — `standards-reviewer`, `spec-reviewer`, `security-reviewer`, `optimization-reviewer`.
- **1 prompt** — `/code-review`.

Skills and the rest of the engineering lifecycle (`/to-spec`, `/to-tickets`, `/implement`, …) are **not** bundled — manage those yourself (e.g. from [mattpocock/skills](https://github.com/mattpocock/skills)).

## License

MIT — see [LICENSE](./LICENSE).