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

## D-012 — The canonical WorkProduct[] work is a Stage 2 continuation, not Stage 3 completion

**Status:** Accepted  
**Date:** 2026-08-29

The `WorkProduct[]` canonical live-state and mutation-synchronisation work — implemented and merged under the branch/PR name "Stage 3" (`stage3/live-workproduct-architecture`, PR #2, "Stage 3: make WorkProduct[] the canonical live state") — is hereby recorded as a **Stage 2 continuation/prerequisite**, not as satisfying the roadmap's Stage 3 definition.

The roadmap's Stage 3 definition (*"Contextual project-centred UI + `App.tsx` decomposition"*) remains unchanged and unimplemented. Nothing in the merged work introduced project-centred UI, a project entity, or any `App.tsx` decomposition — verified directly: `App.tsx` remains a single file, and `projectId` exists only as an unpopulated optional schema field with zero other references in the codebase.

The historical branch name and PR title are preserved unchanged, per the principle that this correction is to the *interpretation* of that work going forward, not a rewrite of the record of what happened. Future references to "Stage 3" should be understood against the roadmap's own definition, not against the branch/PR naming from this period.

## D-013 — `saveWorkProducts()` / `initializeWorkProducts()` is the intended Stage 4 storage boundary

**Status:** Accepted  
**Date:** 2026-08-29

The persistence adapter formed by `saveWorkProducts()` (write) and `initializeWorkProducts()` (one-time init/legacy-import) in `src/lib/workProductStore.ts` / `src/lib/workProductMigration.ts` is formally recorded as the intended seam at which a future `localStorage -> IndexedDB` migration (Stage 4) would be introduced. Both functions already isolate all `pessoa_work_products` storage access behind this boundary; no other code touches that key directly.

This is a boundary decision only. It does not authorise Stage 4 implementation, does not redesign the seam, and does not resolve open questions about Stage 4's actual scope (e.g. whether other `localStorage` keys are included) or about the persistence-failure-handling gap recorded below.

## Deferred

Future-stage proposals and unresolved architectural questions should be recorded here or in a dedicated deferred-work document. Recording a proposal does not authorise implementation.

### Open decision — `saveWorkProducts()` persistence-failure UX

**Status:** Open — not resolved  
**Date recorded:** 2026-08-29

`saveWorkProducts()` returns a `SaveResult` (`{ok, error}`) on write failure, but its only call site (`App.tsx`) discards this value; failure is currently logged to the console only, with no user-visible indication and no retry, dirty-state tracking, or rollback. This is a real, non-hypothetical gap: in-memory state can diverge from persisted state after a failed write, and a reload can silently lose the most recent unpersisted change.

This is explicitly left unresolved. No retry, dirty-state tracking, rollback, or warning UI has been implemented as part of this reconciliation. Resolving it is a product/UX decision, and is deferred until separately authorised — see also D-013, since any Stage 4 (IndexedDB) work would need this decided first, given IndexedDB's more varied failure modes.

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
