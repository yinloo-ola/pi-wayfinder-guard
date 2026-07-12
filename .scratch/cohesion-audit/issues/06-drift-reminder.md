---
Type: task
Status: resolved
Blocked by:
---
# Add ambient grilling/research drift reminder (P4)

## Question

When the agent is in a planning session (`/grilling` or `/research`) and writes to source files, nudge it back toward planning — without a manual toggle, and without misfiring on legitimate implementation work.

## Decision (from grilling)

**Auto-detect planning mode from session history.** No explicit command, no toggle. The handler scans recent user messages for planning-skill invocations; an implementation-skill invocation resets it.

## Mechanism

Register a `tool_result` handler (ExtensionAPI event, see `dist/core/extensions/types.d.ts`). For `edit` and `write` results whose `input.path` is a source path, and when planning mode is active, return `{ content: [...original, reminderText] }` to append a soft, non-blocking reminder.

## Design

1. **Mode detection** — scan the most recent ~15 session entries (via `ctx.sessionManager.getEntries()`) for user-message slash-command tokens:
   - **Planning triggers** (enter planning mode): `/grilling`, `/research`, and their `/skill:` variants **only**. Deliberately narrow — wayfinder, to-spec, to-tickets, prototype, domain-modeling are excluded because they can legitimately edit code.
   - **Implementation triggers** (exit planning mode): `/implement`, `/tdd`, `/code-review`, and their `/skill:` variants.
   - Latest trigger in the window wins. No trigger in the window → mode off (don't nag).
2. **Source-path predicate** — `isSourcePath(p)` returns true for writes under `src/`, `lib/`, `app/`, `cmd/`, `internal/`, `pkg/`, or files with a source extension (`.ts`, `.js`, `.go`, `.py`, `.rs`, `.java`, …) **outside** the allow-list: `.scratch/`, `docs/`, `docs/adr/`, `.git/`, `node_modules/`, config files, repo root.
3. **Tools covered** — `edit` and `write` only (both carry clean `input.path`). **Bash deferred** — detecting file writes from `input.command` is noisy; note as a known gap in README.
4. **The reminder** — short, ignorable, appended to the tool_result content. Draft:
   > 💡 You're in a planning session (`/grilling`). This write to `src/foo.ts` looks like implementation. If you meant to plan, keep notes in `.scratch/`; if this change is genuinely needed, ignore this nudge.

## Work

- Implement in `src/extension.ts` (new module, e.g. `src/drift-reminder.ts`, wired from the default export).
- Factor `isSourcePath` and the trigger-word lists as named constants for easy review.
- Add a short subsection to README documenting the feature, its triggers, the allow-list, and the bash gap.

## Constraints

- **Soft only** — never block, never error. The reminder is text appended to a result the agent already sees.
- The detection scans *user* messages — so model-initiated implementation (without the user typing `/implement`) won't flip the mode. That's intended: the reminder tracks the user's stated intent.
- Must allow writes to `.scratch/` unconditionally (that's the issue tracker — planning writes there are correct).

## Done when

- `/grilling` then a `write` to `src/foo.ts` → reminder appended to the write's tool_result.
- `/grilling` then a `write` to `.scratch/x.md` → no reminder.
- `/grilling` then `/implement` then a `write` to `src/foo.ts` → no reminder (mode reset).
- `/research` behaves same as `/grilling`.
- No reminder fires when no planning skill was invoked.
- README documents the feature honestly, including the bash gap.

## Answer

**Ruled out of scope of this map** (see the map's **Out of scope** section). This is a net-new feature, not a cohesion fix, and it was bundled into a map whose destination is cohesion. Two reasons it leaves this map rather than getting built here:

1. **Wrong map.** The destination is *cohesion* — broken references, command collisions, flag violations, documented workflow, honest deltas. A session-scanning drift detector with `tool_result` injection is feature work, and shipping fragile auto-detection (known bash gap, relies on scanning user messages for slash tokens) inside a cohesion release is the kind of overload this whole skill set exists to avoid.
2. **Duplicates an existing guard.** The `grilling` skill already carries the gate this would enforce — "do not enact the plan until I confirm we have reached a shared understanding." That gate was put in the *skill* on purpose. Building tool-level enforcement on top, before establishing the in-skill gate is insufficient, is speculative.

The design above is **not discarded** — it is raw material for a future effort. The right path, when this is wanted, is a fresh wayfinder map whose first tickets are a **grilling** ("is the in-skill confirmation gate actually insufficient? show me the drift") and a **prototype** (cheap detector to react to), before any task ticket like this one.

Scope boundary, not a route step — so this stays out of the map's Decisions-so-far and lives as one line in its Out of scope section.