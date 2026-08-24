# Pessoa Decisions

This file records decisions that constrain implementation across stages.

## D-001 — Staged engineering roadmap

**Status:** Accepted  
**Date:** 2026-08-24

Pessoa is developed through the staged roadmap in `docs/ROADMAP.md`.

The current stage is the maximum permitted implementation scope. Later-stage work is deferred until the current stage has passed its gate.

## D-002 — Stage 1 is a hard trust gate

**Status:** Accepted  
**Date:** 2026-08-24

AI routing, privacy, provenance, and the shared task layer are treated as P0 trust concerns. Stage 2 and later work must not begin until Stage 1 is verified.

## D-003 — No automatic privacy downgrade

**Status:** Accepted  
**Date:** 2026-08-24

A failure of a more private processing route must never automatically escalate a task to a less private route. In particular, LOCAL → CLOUD requires an explicit user decision.

## D-004 — Repository is the engineering source of truth

**Status:** Accepted  
**Date:** 2026-08-24

The repository documentation, current code, tests, and recorded decisions are the persistent source of truth for AI-assisted development. Conversation context and uploaded copies are not authoritative when they conflict with repository state.

## D-005 — Stage advancement is human-controlled

**Status:** Accepted  
**Date:** 2026-08-24

AI agents may assess readiness and recommend advancement, but only an authorised human may change `current_stage` in `docs/ROADMAP.md`.

## Deferred

Future-stage proposals and unresolved architectural questions should be recorded here or in a dedicated deferred-work document. Recording a proposal does not authorise implementation.
