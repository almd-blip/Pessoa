# Pessoa — Work Log

This log records implementation work against approved designs, distinguishing:

- **FACT** — confirmed by direct inspection of the repository.
- **CONTRACT** — required by `docs/PRODUCT-CONTRACT.md` or another governance document.
- **PROPOSAL** — a recommended design, not yet (or not further) authorised.
- **DECISION** — an approved choice, already implemented.
- **OPEN DECISION** — requires human approval before proceeding further.
- **DEFERRED** — explicitly out of scope for the current stage.

Recording something here is not itself authorisation for further changes.

---

## Stage 3 — Live WorkProduct Architecture

**Status as of this entry: implementation complete, validated, and committed. Commit `4c3a62eb4eacd4720f707392714d2d3ed41cee9b` on branch `stage3/live-workproduct-architecture` (parent: `075e6fb93b11184d07583f08b0f36a2adeaaa2ae`).**

Governing documents: `docs/DECISIONS.md` (D-006 through D-011, and the approved Stage 3 Live WorkProduct Architecture Proposal recorded in conversation), `docs/PRODUCT-CONTRACT.md`.

### DECISION — Approved scope (unchanged from the Stage 3 proposal's approval)

- Canonical `WorkProduct[]` live state: **approved**.
- Synchronise all existing mutation paths (Papers, Research Journeys, publishing): **approved**.
- `ResearchWellbeing` publishing-note bypass fix (route through canonical state via a shared `onAddPublishingNote` handler): **approved**.
- Preserve existing domain payloads (`Paper`, `ResearchJourney`, `PublishingDraftPayload`) unmodified: **approved**, and honoured — no schema/type redesign has been made.
- No Stage 4 storage migration, no speculative schema expansion, no UI redesign: all **out of scope**, none introduced.

### DECISION — Implemented so far

- `src/lib/workProductStore.ts` (new) — pure canonical-state mutation functions (`updatePaper`, `addPaper`, `deletePaper`, `updateJourney`, `addJourney`, `deleteJourney`, `updatePublishingFields`, `addPublishingNote`, `resetWorkProductsToSeed`, `restoreDemoPapersAndJourneys`, selectors) plus the thin `saveWorkProducts` persistence adapter. 18 tests, all passing (Node built-in `node:test`, no new dependency).
- `src/lib/workProductMigration.ts` — added `initializeWorkProducts()`: runs the existing legacy-import logic exactly once (only if `pessoa_work_products` does not yet exist), and simply returns existing canonical state on every subsequent call. `runWorkProductMigration()` itself is unchanged and still exported/tested, but is no longer the live App.tsx entry point (doc comment updated to say so). 32 pre-existing tests, still passing.
- `src/App.tsx` — `papers`/`journeys` `useState` replaced by a single `workProducts` `useState` initialised via `initializeWorkProducts()`, with `papers`/`journeys`/`publishingDraft` as `useMemo` selectors so every existing consumer keeps receiving the same shapes it always has. All six existing mutation handlers (`handleUpdatePaper`, `handleAddPaper`, `handleDeletePaper`, `handleUpdateJourney`, `handleAddJourney`, `handleDeleteJourney`) rewritten to call the new store functions. `handleDeleteJourney`'s existing `activeJourneyId` side effect is preserved exactly. `handleResetAllData`/`handleRestoreDemoData` rewritten onto `resetWorkProductsToSeed`/`restoreDemoPapersAndJourneys`, preserving the pre-existing asymmetry that "Restore Demo Data" has never touched publishing state. The two `scholar_papers`/`scholar_journeys`-writing effects and the Stage 2 per-load migration-trigger effect are removed, replaced by one effect calling `saveWorkProducts(workProducts)`. New `handleAddPublishingNote`/`handleUpdatePublishingFields` handlers added and wired to `<ResearchWorkspace>` and both `<ResearchWellbeing>` render sites.
- `src/components/ResearchWorkspace.tsx` — three new props (`publishingDraft`, `onUpdatePublishingFields`, `onAddPublishingNote`) added to its interface and threaded through to `<CreativePublishingWorkspace>`.
- `src/components/CreativePublishingWorkspace.tsx` — `documentTitle`/`draftContent`/`importedDocs`/`outline`/`checklist` now initialise from the `publishingDraft` prop instead of reading `localStorage` directly; local `notes` state removed entirely (reads `publishingDraft.notes` directly; mutated only via the new `onAddPublishingNote` handler, never local `setNotes`); the six independent persistence effects collapsed into one effect covering `docTitle`/`draftContent`/`outline`/`checklist`/`importedDocs`. `selectedJournalTargetId`/`customTargetWords` deliberately left reading from `localStorage` exactly as before (see below).

### FACT — a pre-existing gap, deliberately left unfixed

`pub_journal_target_id` is live-mutable via a UI dropdown but was never actually persisted anywhere in the pre-Stage-3 code (no effect existed for it); `pub_custom_target_words`'s setter was never called anywhere at all (fully inert). This predates Stage 3. `selectedJournalTargetId`/`customTargetWords` were deliberately left exactly as local, mount-once-from-`localStorage`, never-pushed-to-canonical-state — preserving this exact pre-existing (arguably buggy) behaviour rather than fixing it, per "keep the change minimal."

### FACT — the note-shape discrepancy (compatibility fact, not redesigned)

`ResearchWellbeing.tsx`'s "save session intent as a note" feature constructs a note object shaped `{ id, title, content, category, tags, createdAt }` — not the `NoteCard` interface's `{ id, title, content, tags, updatedAt }` (no `category`, `createdAt` instead of `updatedAt`). This predates Stage 3 (it was already writing this shape directly into raw `pub_notes` JSON). The new `addPublishingNote` store function accepts and stores this shape completely unmodified — no field renaming, dropping, or normalisation. One concrete, minor, and deliberately-not-fixed consequence: `CreativePublishingWorkspace.tsx`'s note-rendering UI displays `note.updatedAt`, which is `undefined` for a wellbeing-sourced note (it has `createdAt` instead) — the note's title and content still render correctly and the note remains visible; only its displayed date is blank. This is not being fixed as part of this change, per the instruction not to redesign or normalise the two shapes.

### DECISION — preserve the existing Publishing Workspace sample/default content

**Resolved.** Decision: preserve the existing first-run sample content, implemented without creating a second source of truth for it.

**Rationale, as given:** the current content is sample/demo material rather than genuine user work, but that does not mean it should be removed as part of the Stage 3 architecture change. The objective of Stage 3 is to make `WorkProduct[]` canonical while preserving existing application behaviour; removing the sample essay, outline, notes, checklist, and imported-document sample would have been an unnecessary product-behaviour change, not something Stage 3's architecture required.

**How it was implemented:**

1. The five sample-content constants (`SAMPLE_DRAFT_CONTENT` — the sample essay, previously an inline literal, now a named exported constant; `DEFAULT_OUTLINE`, `INITIAL_NOTES`, `DEFAULT_CHECKLIST`, `DEFAULT_IMPORTED_DOCS`) remain defined in `CreativePublishingWorkspace.tsx` — their one and only home — and are now `export`ed rather than deleted, per the instruction that they "may be retained if needed to initialise the canonical publishing draft."
2. `workProductMigration.ts`'s `parseLegacyPublishing` gained one optional parameter, `useSampleContentForAbsentFields` (default `false`, so every existing caller and test is completely unaffected). When `true`, a field falls back to its sample constant **only** when the corresponding legacy key was never persisted at all (`raw.X === null`) — a legacy key that was explicitly persisted, even as an empty value, or is malformed, still migrates to a genuinely empty value, exactly as before. This preserves Stage 2's already-established "empty/malformed legacy data migrates to empty" behaviour precisely, and is the only place this distinction is implemented.
3. `runWorkProductMigration` gained a matching optional pass-through parameter (also defaulting to `false`).
4. `initializeWorkProducts()` — the one function actually invoked by the live app — is the only call site that passes `true`. This means the sample content is written into the canonical `publishing_draft` WorkProduct **once**, the first time the app ever initialises with no `pub_*` legacy data present, and becomes real, persisted canonical data from that point on -- not a value fabricated locally by the component on every mount. There is exactly one source of truth for it: `pessoa_work_products`.
5. `resetWorkProductsToSeed` (used by "Reset All Data") deliberately does **not** pass this flag — resetting has always meant "wipe to a genuinely clean state," not "restore onboarding samples," and this asymmetry is preserved exactly as it existed before Stage 3.
6. No redesign of the sample content itself — the recovered essay text was verified character-for-character against the frozen pre-Stage-3 commit before being moved into its new named constant.

**Regression coverage added:** 9 new tests (`workProductMigration.test.ts`) covering: the flag defaulting to off leaves existing (empty-default) behaviour unchanged; the flag restoring the exact sample content when every field is absent; the flag NOT overriding a field that was genuinely persisted (even as an explicit empty value); the flag NOT treating malformed data as "absent"; `runWorkProductMigration(true)` vs. the unflagged default; and an end-to-end `initializeWorkProducts()` test on a fully fresh environment (no `pessoa_work_products`, no legacy keys at all) confirming the full wiring restores the sample content, plus a test confirming a second `initializeWorkProducts()` call never re-derives over a live in-session edit.

**Validation:** `tsc --noEmit` — 0 errors. Full test suite — 59/59 passing (50 pre-existing + 9 new).


### DECISION — `ResearchWellbeing` wiring completed, since it does not depend on the open decision above

The mechanics of `addPublishingNote` (prepending a note to whatever `publishing_draft.notes` currently contains) are unaffected by whether that array's *first-run* default is `[]` or `INITIAL_NOTES` — the wiring itself does not touch or depend on the default-value question. This has been completed:

- `ResearchWellbeing.tsx` no longer touches `localStorage['pub_notes']` at all. Its "save session intent as a note" feature now calls a new optional `onAddPublishingNote` prop, threaded from `App.tsx`'s `handleAddPublishingNote` (the same shared handler `CreativePublishingWorkspace.tsx`'s own "add note" button now calls). The note object's shape is passed through completely unmodified (still `{ id, title, content, category, tags, createdAt }`, still not conforming to `NoteCard`) -- no normalisation was introduced, consistent with the note-shape discrepancy remaining a documented compatibility fact, not something resolved here.
- The unrelated `scholar_current_session_intent` key (the session-intent textbox's own persistence, a different concern entirely) is untouched.

**Validation after this change:** `tsc --noEmit` — 0 errors. Both test suites (`workProductStore.test.ts`, `workProductMigration.test.ts`) — 50/50 passing.

The defaults question above remains open and untouched. No commit has been made.
