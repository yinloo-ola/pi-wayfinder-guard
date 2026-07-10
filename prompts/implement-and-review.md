---
description: Implement a ticket with TDD, then review the result
---
Use the subagent tool with the **chain** parameter to execute this workflow:

1. First, use the "implementer" agent to implement: $@
2. Then, use the "reviewer" agent to review the implementation from the previous step (use `{previous}` placeholder to pass the implementer's output)

Execute this as a chain, passing output between steps via `{previous}`.