# ADR 0002 — Fog-state derivation from active skill

**Status:** Accepted
**Date:** 2026-07-14
**Supersedes:** the earlier draft of this ADR (which proposed
`pi.sendUserMessage("/wayfinder on")` as the toggle seam — that approach is
**rejected**, see "Rejected alternatives" below).

## Context

The original design registered a `/wayfinder` slash command that toggled a
module-private `let fogMode` boolean. When a second extension
(`pi-web-sync`'s `command-handler.ts`) needed to toggle fog programmatically,
three candidate seams were investigated:

1. `pi.sendUserMessage("/wayfinder on")` — dispatch the command via the input
   pipeline.
2. Export a `setFogMode(on, pi, ctx)` function from the guard; callers import it.
3. A custom-message protocol: guard observes a `wayfinder-guard:set-fog`
   custom message; callers send it with `pi.sendMessage`.

Investigation against the pi **source** (not just docs) revealed that seam #1
is impossible and seam #2/#3 are unergonomic. Rather than ship a fragile
toggle, we changed the model: **fog state is derived from the active skill,
not toggled by a command.** This eliminates the cross-extension toggle
problem entirely.

## Decision

**Remove the `/wayfinder` command. Derive fog state from skill transitions:**

- `/skill:wayfinder` (or any name in `FOG_ON_SKILLS`)  → fog **ON**
- `/skill:implement` (or any name in `FOG_OFF_SKILLS`) → fog **OFF**
- any other skill, or a non-skill message              → fog **unchanged**

A `/fog on|off|auto` command remains as a **manual override** (escape hatch),
pinning fog until the next `/fog` call; while pinned, skill transitions are
ignored. `/fog auto` clears the pin so skill transitions resume driving
fog.

### Detection mechanism (verified against pi source)

All file references are against the installed pi package at
`/Users/yinlootan/.nvm/versions/node/v22.22.3/lib/node_modules/@earendil-works/pi-coding-agent`
(henceforth `$PI`), version `^0.80.6`.

1. **Primary — `message_start` + `parseSkillBlock`.** When the user runs
   `/skill:wayfinder`, pi expands it into a `<skill name="wayfinder" …>…</skill>`
   block in the finalized user message
   (`$PI/dist/core/agent-session.js:944`, `_expandSkillCommand`). That message
   fires `message_start` with `event.message.role === "user"`
   (`$PI/dist/core/agent-session.js:1074`, bridged to extensions at
   `:437-442`). The guard calls pi's own **exported** `parseSkillBlock`
   (`$PI/dist/index.js:5`; runtime-confirmed via ESM import) on the message
   text and reads `parsed.name`. Using pi's parser (not a hand-rolled regex)
   means we match exactly what the model sees, regardless of how the skill
   block entered the conversation (typed `/skill:…`, RPC, or re-injected).

2. **Resume / fork — `context` event back-compute.** `message_start` only
   fires for *new* messages, so a session resumed mid-wayfinder would start
   with fog off. The `context` event
   (`$PI/dist/core/extensions/types.d.ts`, `ContextEvent.messages: AgentMessage[]`;
   fires every turn per `$PI/docs/extensions.md:296`) carries the full
   transcript. On the first `context` after (re)start the guard walks the
   transcript most-recent-first, finds the most recent skill block, and seeds
   `fogMode`. (`SessionStartEvent` does **not** expose the transcript, so it
   cannot be used for this — verified at `$PI/dist/core/extensions/types.d.ts`.)

3. **`before_agent_start` and `tool_call`** read the now-derived `fogMode`
   unchanged — no edits needed to those handlers beyond reading a derived
   value instead of a toggled one.

### Why derivation is strictly better than a toggle

- **No cross-extension API needed.** Fog flips automatically when the user
  runs the wayfinder/implement skill. `pi-web-sync` doesn't need to toggle
  anything — it just relays `/skill:wayfinder` like any other skill, and fog
  follows.
- **No state desync.** The guard computes state from the conversation itself;
  it cannot be "out of sync" with reality the way a manual toggle can.
- **Survives resume.** The `context` back-compute reconstructs the correct
  state from the transcript.
- **Wayfinder is a phase, not a momentary mode.** Derivation matches the
  domain: fog is on for the *duration* of the wayfinder phase, off for the
  implement phase.

## Considered (and rejected) alternatives

### ❌ `pi.sendUserMessage("/wayfinder on")` — does NOT dispatch commands

**This was the original ADR's recommendation. It is wrong.** Smoking gun at
`$PI/dist/core/agent-session.js:1108-1110`:

```js
async sendUserMessage(content, options) {
    …
    await this.prompt(text, {
        expandPromptTemplates: false,   // ← disables command dispatch
        …
        source: "extension",
    });
}
```

`prompt()` only runs `_tryExecuteExtensionCommand` when
`expandPromptTemplates && text.startsWith("/")` (`:782-784`). `sendUserMessage`
hard-sets `expandPromptTemplates: false`. The literal comment says *"to skip
command handling and template expansion."* So `/wayfinder on` is sent to the
LLM as a plain string and **never reaches the guard's handler** — broken in
both directions (on and off). The earlier ADR trusted the docs' input-pipeline
prose, which describes `prompt()`'s general path but omits that
`sendUserMessage` disables the command branch.

For contrast, the RPC path **does** dispatch commands
(`$PI/dist/modes/rpc/rpc-mode.js:303` calls `session.prompt(message, {source:"rpc"})`
with no `expandPromptTemplates` override, so it defaults to `true` at
`:777`). That is why typing `/wayfinder` in the TUI works but calling
`pi.sendUserMessage("/wayfinder")` from an extension does not — different
code paths.

### ⚠️ Export `setFogMode` and import it cross-extension

Would work (typed, no transcript pollution), but pi's extension loader
(`$PI/dist/core/extensions/loader.d.ts`; `VIRTUAL_MODULES`/`getAliases`) does
not contractually wire extensions to import from each other — a bare
`import { setFogMode } from "pi-wayfinder-guard/…"` resolves only if the
caller's `node_modules` happens to contain the guard at the right path.
Reliable only in a tightly-coupled monorepo; fragile for an
independently-versioned npm package. Moot under derivation (no caller needs
to toggle fog).

### ⚠️ Custom-message observer

Investigation corrected an earlier claim: there **is** an observation hook.
`pi.sendMessage({customType,…})` → `sendCustomMessage`
(`$PI/dist/core/agent-session.js:1047`) which in its default branch **emits
`message_start`/`message_end`** with `role === "custom"`
(`:1073-1076`, bridged to extensions at `:437-457`). So an extension *can*
observe another extension's custom message via `pi.on("message_start", …)`.
However it (a) leaves a transcript entry each toggle (mitigatable with
`display:false` + a no-op renderer), (b) gives a plain `ExtensionContext`
not the command context, and (c) is a broadcast. Workable but unergonomic
relative to derivation. Moot under derivation.

### ❌ Flags (`registerFlag` / `getFlag`)

`registerFlag` only sets a default + exposes a `--flag` CLI arg
(`$PI/dist/core/extensions/types.d.ts:883`); `getFlag` reads it (`:889`);
there is **no `setFlag`**. Another extension cannot mutate a flag at runtime.
Dead end.

## Consequences

**Positive:**

- `/wayfinder` command removed — one less manual toggle to get wrong.
- Fog state is always correct, derived from the conversation; no desync, no
  cross-extension API, no import coupling.
- `pi-web-sync` (or any other extension) needs no special fog API: it just
  relays `/skill:wayfinder` and `/skill:implement` like any skill.
- Survives session resume/fork via the `context` back-compute.

**Negative / accepted trade-offs:**

- **No mid-phase manual toggle.** Previously `/wayfinder off` could lift fog
  for a quick edit mid-wayfinder. Mitigated by the `/fog on|off` override,
  which pins state until the next `/fog` call (it does not auto-clear on the
  next skill transition — that would re-introduce desync). The override is
  sticky and must be cleared by the user.
- **Exit set must be maintained.** `FOG_OFF_SKILLS` currently contains only
  `"implement"`. If the workflow grows more "implementation start" skills,
  they must be added here, or fog will stay on through them. (Mid-phase
  skills like `/to-spec`, `/to-tickets` are deliberately *not* in either set,
  so they leave fog unchanged — matching "until /implement is started".)
- **`context` back-compute runs once per session.** After the first `context`
  event sets `contextSeeded = true`, subsequent transcript changes are
  ignored by the seeder; all further transitions flow through `message_start`.
  This is correct for live editing but means a programmatic bulk-insert of
  historical messages mid-session wouldn't re-seed. Acceptable (not a real
  workflow).

## Sources

- `sendUserMessage` disables command dispatch:
  `$PI/dist/core/agent-session.js:1108-1110` (`expandPromptTemplates: false`),
  `:782-784` (dispatch gated on `expandPromptTemplates && text.startsWith("/")`)
- RPC path dispatches commands: `$PI/dist/modes/rpc/rpc-mode.js:303`,
  default `expandPromptTemplates ?? true` at `$PI/dist/core/agent-session.js:777`
- `_tryExecuteExtensionCommand`: `$PI/dist/core/agent-session.js:903-928`
- Skill expansion → `<skill name="…">` block: `$PI/dist/core/agent-session.js:933-945`
- `parseSkillBlock` exported (runtime): `$PI/dist/index.js:5`, `$PI/dist/index.d.ts:3`
- `message_start` fires for user messages incl. expanded skills:
  `$PI/dist/core/agent-session.js:1074`, bridged at `:437-442`
- `context` event carries transcript: `$PI/dist/core/extensions/types.d.ts`
  (`ContextEvent.messages`); fires every turn per `$PI/docs/extensions.md:296`
- `SessionStartEvent` has no transcript field: `$PI/dist/core/extensions/types.d.ts`
- Custom messages emit `message_start`/`message_end`:
  `$PI/dist/core/agent-session.js:1047-1076` (`sendCustomMessage`)
- Flags are CLI-only, no `setFlag`: `$PI/dist/core/extensions/types.d.ts:883,889`,
  `$PI/docs/extensions.md:1588`
- Guard implementation: `src/extension.ts` (`FOG_ON_SKILLS`, `FOG_OFF_SKILLS`,
  `message_start` handler, `context` seeder, `/fog` override)