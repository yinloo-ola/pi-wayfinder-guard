# Matt Pocock Review Workflow

Five-axis code review that runs as the final quality gate in the Matt Pocock workflow (wayfinder → to-spec → to-tickets → implement → review).

## Language

**Code review**:
A multi-axis quality gate that runs five specialized agents in parallel, each checking a distinct concern against the diff since a fixed point.
_Avoid_: Code audit, PR review, QA pass

**Review axis**:
One of the five specialized review perspectives run by `/review`. Each axis has a dedicated agent with its own methodology and output format.
_Avoid_: Review category, review type, review dimension

**Seam**:
The boundary between two layers or modules in a call chain (handler→service→repository→DB). Seams are where AI-filled stubs most often break — both sides work in isolation but don't wire together.
_Avoid_: Interface, boundary, contract point

**Round-trip proof**:
A structured trace of a single input from entry point through all layers and back to the response, verifying coherence at every seam. The primary output of a traceability review.
_Avoid_: End-to-end test, integration check

**Production hazard**:
A specific risk pattern that can cause production incidents — unbounded operations, OOM loops, silent error swallowing, raw injection, missing concurrency limits.
_Avoid_: Bug, defect, security issue

**Socratic heuristic**:
An adversarial framing used to stress-test code during review. Three exist: Scale to 100x (performance), Hostile World (security), Silent Error (reliability).
_Avoid_: Scenario, test case, thought experiment

**Hostile World**:
The framing that motivates the security-reviewer — assume every external input is controlled by a malicious actor trying to exploit, crash, or extract data.
_Avoid_: Threat model, attack scenario

**Scale to 100x**:
The performance heuristic — if this code ran 100x/sec or on 100k items, what breaks? Memory, CPU, disk, sockets, DB connections.
_Avoid_: Load test, benchmark

**Silent Error**:
The reliability heuristic — if a downstream dependency hangs or fails silently, how does the system react? Timeout? Back-off? Logging?
_Avoid_: Fault tolerance, error handling

**Fog mode**:
The wayfinder phase where source-code edits, dependency installs, and git mutations are blocked. Only exploration, notes, and planning allowed.
_Avoid_: Locked mode, read-only mode

**Fog note**:
The system-prompt text injected while fog mode is active, reminding the model that implementation is blocked.
_Avoid_: Wayfinder reminder, fog message

**Exit reminder**:
A one-time message delivered to the model when `/wayfinder off` is run, confirming fog mode has ended and implementation is allowed again.
_Avoid_: Off message, unlock notice