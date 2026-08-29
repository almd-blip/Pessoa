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

## D-006 — Wellbeing/reflection data excluded from Stage 2 WorkProduct migration

**Status:** Accepted  
**Date:** 2026-08-25

`scholar_moods`, `wellbeing_small_wins`, `second_thought_insights`, and `daily_focus` are not migrated into `WorkProduct[]` at Stage 2, and no new `reflection` WorkProduct kind is introduced. This is a deliberate deferral of a genuinely ambiguous classification question (see the Stage 2 Design Proposal), not an oversight. These keys remain exactly where they are, untouched.

## D-007 — `projectId` is not populated during Stage 2 migration

**Status:** Accepted  
**Date:** 2026-08-25

`WorkProduct.projectId` exists as an optional schema field, but Stage 2 migration never invents or heuristically assigns it (no inferring projects from Research Journeys, no auto-assigning Papers to Journeys). Project resolution and any project-centred UI are Stage 3 work.

## D-008 — Migrated WorkProduct timestamps use migration time, not fabricated history

**Status:** Accepted  
**Date:** 2026-08-25

For legacy records with no historical `createdAt`/`updatedAt`, migration sets both to the migration run's timestamp, explicitly documented as migration time rather than true historical creation time. `createdAt` is preserved unchanged across subsequent migration runs once first set (looked up by id); `updatedAt` legitimately refreshes on each successful re-derivation.

## D-009 — Legacy storage keys are retained during Stage 2

**Status:** Accepted  
**Date:** 2026-08-25

`scholar_papers`, `scholar_journeys`, and the publishing `pub_*` keys are not deleted during Stage 2. Migration to `pessoa_work_products` is strictly additive. Deletion or reclamation of the legacy keys is deferred until the new representation has been verified in practice, to be revisited after Stage 3.

## D-010 — No new persistence for structured AI results in Stage 2

**Status:** Accepted  
**Date:** 2026-08-25

`EvidenceMap`, `ResearchQuestionAnalysis`, `PatternAndDataAnalysis`, `CriticalPartnerFeedback`, and `LiteratureSynthesisResult` may be represented by the `WorkProduct` schema in principle, but Stage 2 does not add persistence for them, since none of them are currently persisted anywhere — there is no existing data to migrate, and adding persistence now would be new AI-adjacent product behaviour, not a migration.

## D-011 — Publishing is modelled as a single current workspace

**Status:** Accepted  
**Date:** 2026-08-25

Stage 2 creates exactly one `kind: "publishing_draft"` WorkProduct, combining the eight `pub_*` legacy keys, representing the one current publishing workspace the application supports today. Multi-document publishing architecture is out of scope for Stage 2.

## Deferred

Future-stage proposals and unresolved architectural questions should be recorded here or in a dedicated deferred-work document. Recording a proposal does not authorise implementation.

### Known pre-existing issue — Research Intelligence route mismatch

**Status:** Fixed (see below)  
**Date recorded:** 2026-08-25  
**Date fixed:** 2026-08-25  
**Scope:** Functional bug, not a P0 trust/routing concern. Fixed as a standalone change, independent of Stage 1 and not on the p0-trust-hardening branch.

`src/components/ResearchIntelligenceLayer.tsx` calls two client-side endpoint
paths that do not match the corresponding server routes in `server.ts`:

| Client calls | Server actually exposes |
|---|---|
| `/api/gemini/research-intelligence/question-dev` | `/api/gemini/research-intelligence/question-development` |
| `/api/gemini/research-intelligence/pattern-analysis` | `/api/gemini/research-intelligence/data-pattern-analysis` |

This mismatch predated the Stage 1 / P0 trust-hardening work and was
identified during the P0 audit. It caused these two calls to 404 at
runtime regardless of AI provider or routing configuration — a plain
endpoint-naming bug, unrelated to local/cloud routing, provider
selection, credential handling, or output validation.

It was deliberately left unfixed during P0 (both in the initial P0
routing implementation and the subsequent autoFallback/strictOffline
cleanup) per the instruction not to opportunistically fix unrelated
issues encountered while working on P0.

**Resolution:** the two client call sites in `ResearchIntelligenceLayer.tsx`
were updated to match the existing, already-correct server route names
(`question-development`, `data-pattern-analysis`) rather than renaming
the server routes. While correcting the URLs, two related request-body
field-name mismatches on the same two calls were also found and fixed
(`context` → `contextNote`; `csvContent` → `rawData`), since a URL-only
fix would have left both features silently ignoring the user's topic
context / CSV input rather than actually working. Fixed as a standalone
commit, not part of the P0 branch history.
