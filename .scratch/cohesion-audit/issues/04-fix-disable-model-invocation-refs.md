---
Type: task
Status: resolved
Blocked by:
---
# Fix `disable-model-invocation` slash-references to address the user

## Question

Several skills carry `disable-model-invocation: true` yet phrase slash-references as instructions to the model ("Use /tdd", "use /code-review"). The model can't invoke skills under that flag — only the user can. Where does this need fixing, and what's the rule?

## Decision (from grilling)

**Rule: in a `disable-model-invocation: true` skill, every slash-reference is phrased as an instruction to the user, never to the model.** Apply uniformly. Two kinds of references exist; only one kind is a violation:

- **Violation (fix):** "you (model) go do /X now" — rephrase to "suggest the user run /X" / "have the user run /X".
- **Not a violation (leave):** descriptive pointers for the human ("run `/setup-matt-pocock-skills` if not configured") or notes on what a skill does ("`/triage` pulls external PRs…").

## Work

- **`skills/implement/SKILL.md`** — "Use /tdd where possible" → "Suggest the user run /tdd where possible"; "Once done, use /code-review to review the work" → "Once done, suggest the user run /code-review to review the work."
- **`skills/to-tickets/SKILL.md`** — "Work the frontier one ticket at a time with `/implement`" → "Suggest the user work the frontier one ticket at a time with `/implement`."
- **`skills/wayfinder/SKILL.md`** — rephrase the workflow-step instructions: "Run a `/grilling` and `/domain-modeling` session" → "Have the user run a `/grilling` and `/domain-modeling` session"; "invoke the skills the `## Notes` block names" → "have the user invoke the skills the `## Notes` block names"; the Ticket-Types descriptions ("via the /prototype skill", "via the /grilling and /domain-modeling skills") → rephrase to make clear these are user-invoked.

## Leave alone (not violations — already user-facing or descriptive)

- `skills/to-spec/SKILL.md` and `skills/to-tickets/SKILL.md`: "run `/setup-matt-pocock-skills` if not [configured]" — user-facing fallback, correct.
- `skills/setup-matt-pocock-skills/SKILL.md`: "`/triage` pulls external PRs…" — descriptive.

## Constraints

- Minimum-rewrite: change only the phrasing of the violated references, not surrounding prose. Keep attribution.
- Do not add or remove the `disable-model-invocation` flag itself on any skill.

## Done when

- No `disable-model-invocation: true` skill instructs the model to invoke a skill; every slash-reference in those skills is either user-addressed or descriptive.

## Answer

**Done.** Fixed 7 model-addressed slash-references across 3 skills (minimum-rewrite — phrasing only, no flag added/removed):

| skill | was (model-addressed) | now (user-addressed) |
|---|---|---|
| `implement` | "Use /tdd where possible" | "Suggest the user run /tdd where possible" |
| `implement` | "use /code-review to review the work" | "suggest the user run /code-review to review the work" |
| `to-tickets` | "Work the frontier... with `/implement`" | "Suggest the user work the frontier... with `/implement`" |
| `wayfinder` | "Run a `/grilling` and `/domain-modeling` session" | "Have the user run a `/grilling` and `/domain-modeling` session" |
| `wayfinder` | "invoke the skills... use `/grilling`..." | "have the user invoke... have the user run..." |
| `wayfinder` | "via the /prototype skill" | "via the /prototype skill (user-run)" |
| `wayfinder` | "via the /grilling and /domain-modeling skills" | "...skills (user-run)" |

**Left alone (correctly not violations):** the `run /setup-matt-pocock-skills if not` fallbacks in `to-spec`, `to-tickets`, `wayfinder` (user-facing), the descriptive "`/triage` pulls external PRs" in `setup-matt-pocock-skills`, and the `docs/agents/*.md` file-path references.

**Verification:** re-grepped all five `disable-model-invocation: true` skills — every skill-name slash-reference is now user-addressed or descriptive. `to-spec` and `setup-matt-pocock-skills` needed no edits (confirmed by the audit, not assumed).

**This is a delta from upstream** — the rephrased lines now differ from `d574778`. A real Batch 2 entry for _Keep `UPSTREAM-CHANGES.md` honest_ (07), which is now **fully unblocked** (was waiting on 04). No fog graduated.