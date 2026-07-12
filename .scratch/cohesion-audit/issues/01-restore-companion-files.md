---
Type: task
Status: resolved
Blocked by:
---
# Restore 11 missing companion files from upstream

## Question

The audit found companion files referenced by four skills but absent from git/npm source. All 11 exist upstream at `mattpocock/skills` @ `d574778` (the same revision the skills were derived from) — the "create stubs or remove references" note in the HANDOFF is stale. This ticket fetches them verbatim and verifies they ship.

## Files to fetch

From `https://raw.githubusercontent.com/mattpocock/skills/d574778/skills/engineering/<path>`, place into `skills/<path>` in this repo:

- `setup-matt-pocock-skills/issue-tracker-github.md`
- `setup-matt-pocock-skills/issue-tracker-gitlab.md`
- `setup-matt-pocock-skills/issue-tracker-local.md`
- `setup-matt-pocock-skills/triage-labels.md`
- `setup-matt-pocock-skills/domain.md`
- `domain-modeling/CONTEXT-FORMAT.md`
- `domain-modeling/ADR-FORMAT.md`
- `prototype/LOGIC.md`
- `prototype/UI.md`
- `tdd/tests.md`
- `tdd/mocking.md`

## Constraints

- Copy **verbatim** — no edits. Attribution consistency with the `d574778` derivation pin matters.
- `package.json` `files` already lists `"skills/"`, which recursively includes subdirs — no `files` change needed, but the verification step below confirms it.

## Done when

- All 11 files exist under `skills/` with non-trivial content.
- `npm pack --dry-run` lists every companion file in the tarball (proves the `files` field covers them).
- No skill references a companion file that doesn't now exist (`grep` for the referenced filenames across `skills/*/SKILL.md` and confirm each resolves).

## Answer

**Done.** All 11 companion files fetched verbatim from `mattpocock/skills` @ `d574778` (`skills/engineering/<path>`) into `skills/<path>` and verified:

- **All 11 present with real content** — 1.0–6.8 kB each (genuine raw markdown; spot-checked `triage-labels.md` and `prototype/LOGIC.md`, no HTML wrapper).
- **`npm pack --dry-run` ships all 11** — the `"skills/"` entry in `package.json` `files` covers subdirs; no `files` change needed.
- **Every companion reference resolves** — all 11 links across the four skills' `SKILL.md` files now point at existing files.

**One addition beyond the literal done-when:** `NOTICE` enumerated only the 11 `SKILL.md` files as derived, so the 11 restored companions (also derived verbatim from the same upstream revision) were unlisted — an attribution gap. Added them under a new "Companion files" group in `NOTICE`. This is provenance metadata, not a content edit, so it respects the verbatim constraint.

**Heads-up for _Keep `UPSTREAM-CHANGES.md` honest after the deltas_** (07): these 11 restorations are verbatim — **zero delta** from upstream — so they need no Batch 2 entry. Batch 2 is for files that *differ* from upstream; restoring missing verbatim files moves this repo closer to upstream, not away. (The only `NOTICE`/attribution action was the enumeration above.)

No fog graduated and no new ticket surfaced: nothing was blocked by this ticket, and restoring companion files doesn't sharpen either open fog patch.