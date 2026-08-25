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

### Known pre-existing issue — Research Intelligence route mismatch

**Status:** Tracked, not fixed  
**Date recorded:** 2026-08-25  
**Scope:** Functional bug, not a P0 trust/routing concern. Out of scope for Stage 1.

`src/components/ResearchIntelligenceLayer.tsx` calls two client-side endpoint
paths that do not match the corresponding server routes in `server.ts`:

| Client calls | Server actually exposes |
|---|---|
| `/api/gemini/research-intelligence/question-dev` | `/api/gemini/research-intelligence/question-development` |
| `/api/gemini/research-intelligence/pattern-analysis` | `/api/gemini/research-intelligence/data-pattern-analysis` |

This mismatch predates the Stage 1 / P0 trust-hardening work and was
identified during the P0 audit. It causes these two calls to 404 at
runtime regardless of AI provider or routing configuration — it is a
plain endpoint-naming bug, unrelated to local/cloud routing, provider
selection, credential handling, or output validation.

It was deliberately left unfixed during P0 (both in the initial P0
routing implementation and the subsequent autoFallback/strictOffline
cleanup) per the instruction not to opportunistically fix unrelated
issues encountered while working on P0. It should be corrected as its
own small fix, whenever convenient, by aligning either the client call
sites or the server route names.
