# UPSTREAM-CHANGES.md

Deltas between our bundled copies and the upstream source at `mattpocock/skills` @ `d574778`.

## Batch 1: All 11 skills (2026-07-10)

### Type of change

Verbatim copy with attribution header prepended.

### Files affected

| Skill | Upstream path | Delta |
|-------|--------------|-------|
| wayfinder | `skills/engineering/wayfinder/SKILL.md` | +3 lines (attribution header) |
| to-spec | `skills/engineering/to-spec/SKILL.md` | +3 lines (attribution header) |
| to-tickets | `skills/engineering/to-tickets/SKILL.md` | +3 lines (attribution header) |
| implement | `skills/engineering/implement/SKILL.md` | +3 lines (attribution header) |
| code-review | `skills/engineering/code-review/SKILL.md` | +3 lines (attribution header) |
| research | `skills/engineering/research/SKILL.md` | +3 lines (attribution header) |
| prototype | `skills/engineering/prototype/SKILL.md` | +3 lines (attribution header) |
| grilling | `skills/productivity/grilling/SKILL.md` | +3 lines (attribution header) |
| domain-modeling | `skills/engineering/domain-modeling/SKILL.md` | +3 lines (attribution header) |
| tdd | `skills/engineering/tdd/SKILL.md` | +3 lines (attribution header) |
| setup-matt-pocock-skills | `skills/engineering/setup-matt-pocock-skills/SKILL.md` | +3 lines (attribution header) |

### Attribution header

```html
<!-- Derived from mattpocock/skills @ d574778, <upstream-path> -->
Copyright (c) 2026 Matt Pocock. Licensed under MIT.
```

### `disable-model-invocation`

Preserved verbatim per upstream. No changes made. Upstream state:
- **Has `disable-model-invocation: true`:** wayfinder, to-spec, to-tickets, implement, setup-matt-pocock-skills
- **No `disable-model-invocation`:** code-review, research, prototype, grilling, domain-modeling, tdd

(The ticket #04 assumption that `disable-model-invocation` should be added to "workflow skills" was inaccurate — the flag is already present in upstream where Matt has set it, and absent where he hasn't. Verbatim preservation is the correct approach for v0.)