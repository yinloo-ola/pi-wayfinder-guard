# Upstream: pi subagent example

Vendored from `@earendil-works/pi-coding-agent` examples.

- **Package version:** 0.80.6
- **Upstream repo:** https://github.com/earendil-works/pi
- **Commit SHA:** `34582ef34beec868b0df4fb969385b8af5960c45`
- **Vendored files:**
  - `index.ts` ← `examples/extensions/subagent/index.ts`
  - `agents.ts` ← `examples/extensions/subagent/agents.ts`
- **Vendored on:** 2026-07-10
- **License:** MIT (Copyright 2026 earendil-works)

## Import resolution

The vendored files import from `@earendil-works/pi-coding-agent`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-ai`, and `@earendil-works/pi-tui`. These remain as-is — they resolve at runtime via the host pi installation as peerDependencies of our extension package. No import path changes needed.

## Delta tracking

Verbatim copy (B1), unmodified.