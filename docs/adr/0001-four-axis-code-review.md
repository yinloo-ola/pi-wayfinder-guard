# Four-axis parallel code review

The Matt Pocock workflow needs a code review that catches more than coding standards and spec compliance. AI-filled stubs introduce bugs at seams between layers that standard reviews miss, and production hazards go unchecked without a dedicated phase.

The `/code-review` prompt now runs four specialized sub-agents in parallel: **standards-reviewer** (Fowler smells + style), **spec-reviewer** (spec compliance + call chain verification + round-trip proof), **security-reviewer** (security vulnerabilities + production hazards + Hostile World), and **optimization-reviewer** (dead code, duplication, N+1s + Scale to 100x + Silent Error).

Spec and traceability are merged into one agent because they answer the same question: "did we build what was designed?" — spec checks the *what* (requirements), traceability checks the *how* (seams). A single agent can produce both findings without mixing concern boundaries.

Four axes was chosen over five because merging spec+traceability reduces cost while keeping each remaining axis focused on a distinct concern. The Socratic heuristics (Scale to 100x → optimization, Hostile World → security, Silent Error → optimization) are distributed to their natural homes.