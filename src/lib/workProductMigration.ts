/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stage 2 -- WorkProduct migration.
 *
 * See docs/DECISIONS.md (Stage 2 Design Proposal, approved decisions
 * D1-D6, and D-006 through D-011) and docs/PRODUCT-CONTRACT.md for the
 * governing design.
 *
 * This module wraps existing, unmodified Paper / ResearchJourney /
 * publishing data into the WorkProduct envelope (src/types/workProduct.ts).
 * It does not transform, flatten, or reinterpret that data.
 *
 * Stage 3 note: runWorkProductMigration() below (re-derive from legacy
 * state on every call) was Stage 2's live App.tsx entry point. As of the
 * Stage 3 live-WorkProduct-state work, App.tsx instead calls
 * initializeWorkProducts() (bottom of this file) exactly once, at initial
 * load, and never again -- WorkProduct[] is now canonical live state
 * (see src/lib/workProductStore.ts for the ongoing mutation functions),
 * so re-deriving it from legacy keys on every load would overwrite live
 * in-session edits with stale legacy data. runWorkProductMigration()
 * itself is unchanged and remains exported (used by its existing tests,
 * and available for a manual one-off re-import if ever needed), but it is
 * no longer the live application entry point.
 *
 * Design notes:
 *
 * - The parseLegacyPapers / parseLegacyJourneys / parseLegacyPublishing /
 *   mergeWorkProducts functions below are pure: they take
 *   raw strings/values in and return WorkProduct[] out, with no
 *   localStorage access at all. This lets them be unit-tested directly in
 *   Node (see workProductMigration.test.ts, run via the Node built-in test
 *   runner through `tsx --test` -- no new test-framework dependency).
 *   Only runWorkProductMigration(), initializeWorkProducts(), and
 *   readWorkProducts() touch localStorage, and they are thin wrappers
 *   around the pure functions.
 *
 * - Migration is re-derived from current legacy state on every call,
 *   rather than gated by a one-time "already migrated" flag. This
 *   deliberately avoids introducing any new migration-bookkeeping key
 *   (migration bookkeeping and WorkProduct metadata are kept as separate
 *   concerns; no schema-version field is added to WorkProduct itself)
 *   while still being idempotent and safe to call on every app load:
 *   a kind-group's WorkProduct entries are fully REPLACED from the
 *   current legacy state each run (never accreted/duplicated), and
 *   createdAt is preserved across runs by looking up the existing
 *   WorkProduct with the same id, so re-running never fabricates a new
 *   "creation" time for a record that was already migrated once.
 *   updatedAt legitimately refreshes on every successful run, reflecting
 *   the most recent derivation.
 *
 * - If a source key's top-level shape cannot be parsed at all (malformed
 *   JSON, or valid JSON that is not an array), that kind-group's existing
 *   WorkProduct entries are left completely untouched for this run (not
 *   cleared, not overwritten), and the legacy source key itself is never
 *   modified. The next call (e.g. the next app load) simply tries again --
 *   this is what makes migration "retryable" without any separate
 *   persisted status/version key.
 *
 * - Publishing (docs/DECISIONS.md, D6) is always a single record, so
 *   unlike papers and journeys there is no "top-level shape invalid, skip
 *   the whole group" case for it: each of its 8 source fields degrades
 *   independently to an empty/default value if missing or malformed, and a
 *   publishing_draft WorkProduct is always produced. This never overwrites
 *   the legacy pub_* keys.
 */

import { Paper, ResearchJourney } from '../types';
import { INITIAL_JOURNEYS } from '../data';
import {
  OutlineItem,
  NoteCard,
  PublisherChecklistItem,
  ImportedDocument,
  SAMPLE_DRAFT_CONTENT,
  DEFAULT_OUTLINE,
  INITIAL_NOTES,
  DEFAULT_CHECKLIST,
  DEFAULT_IMPORTED_DOCS,
} from '../components/CreativePublishingWorkspace';
import {
  WorkProduct,
  WorkProductPaper,
  WorkProductResearchJourney,
  WorkProductPublishingDraft,
  PublishingDraftPayload,
} from '../types/workProduct';

export const WORK_PRODUCTS_KEY = 'pessoa_work_products';

// The single, stable id for the one current publishing workspace (see
// docs/DECISIONS.md, approved decision D6 -- Stage 2 does not implement
// multi-document publishing).
export const PUBLISHING_DRAFT_ID = 'publishing-draft-current';

export interface GroupMigrationResult<T extends WorkProduct> {
  /** The full, replacement set of WorkProducts for this kind, in stable
   * (source-array) order. */
  items: T[];
  /** False only when the top-level source shape could not be parsed at all
   * (malformed JSON, or valid JSON that is not an array). When false, the
   * caller must leave this kind-group's existing WorkProduct entries
   * untouched rather than replacing them with an empty set. */
  succeeded: boolean;
  /** Count of individual records skipped because they lacked a valid
   * string id. Logged by the caller; migration continues for the rest of
   * the array. */
  skippedCount: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Pure. Parses a raw scholar_papers value into WorkProduct<'paper'> entries.
 * existingById lets createdAt survive across repeated migration runs.
 *
 * Validity rule matches the one already used by App.tsx's own papers
 * loader: a plain object with a non-empty string id. Unlike App.tsx's
 * loader (which discards the ENTIRE array if any single element is
 * invalid), this migrates every individually-valid record and only skips
 * the invalid ones -- consistent with "create one WorkProduct per valid
 * Paper".
 */
export function parseLegacyPapers(
  raw: string | null,
  nowIso: string,
  existingById: Map<string, WorkProductPaper>
): GroupMigrationResult<WorkProductPaper> {
  if (raw === null) {
    return { items: [], succeeded: true, skippedCount: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { items: [], succeeded: false, skippedCount: 0 };
  }

  if (!Array.isArray(parsed)) {
    return { items: [], succeeded: false, skippedCount: 0 };
  }

  let skippedCount = 0;
  // Map, not array, so a duplicate id within the source array collapses to
  // one record (last occurrence wins) rather than producing two
  // WorkProducts with the same id.
  const byId = new Map<string, Paper>();
  for (const candidate of parsed) {
    if (!isPlainObject(candidate) || typeof candidate.id !== 'string' || candidate.id.length === 0) {
      skippedCount += 1;
      continue;
    }
    // Preserve the complete parsed object (spread), including any fields
    // not in the current Paper interface, rather than reconstructing it
    // field-by-field.
    byId.set(candidate.id, { ...candidate } as unknown as Paper);
  }

  const items: WorkProductPaper[] = Array.from(byId.entries()).map(([id, payload]) => {
    const existing = existingById.get(id);
    return {
      id,
      kind: 'paper',
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      payload,
    };
  });

  return { items, succeeded: true, skippedCount };
}

/**
 * Pure. Parses a raw scholar_journeys value into
 * WorkProduct<'research_journey'> entries, reusing the exact same per-field
 * defensive normalisation already used by App.tsx's own journeys loader
 * (Array.isArray checks per nested field, falling back to the matching
 * INITIAL_JOURNEYS seed, then to []) -- not a second, incompatible
 * interpretation of the data.
 */
export function parseLegacyJourneys(
  raw: string | null,
  nowIso: string,
  existingById: Map<string, WorkProductResearchJourney>
): GroupMigrationResult<WorkProductResearchJourney> {
  if (raw === null) {
    return { items: [], succeeded: true, skippedCount: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { items: [], succeeded: false, skippedCount: 0 };
  }

  if (!Array.isArray(parsed)) {
    return { items: [], succeeded: false, skippedCount: 0 };
  }

  let skippedCount = 0;
  const byId = new Map<string, ResearchJourney>();
  for (const candidate of parsed) {
    if (!isPlainObject(candidate) || typeof candidate.id !== 'string' || candidate.id.length === 0) {
      skippedCount += 1;
      continue;
    }
    const saved = candidate as Partial<ResearchJourney> & Record<string, unknown>;
    const initialMatch = INITIAL_JOURNEYS.find((initial) => initial.id === saved.id);
    const normalised = {
      ...saved,
      questions: Array.isArray(saved.questions) ? saved.questions : (initialMatch?.questions || []),
      chapters: Array.isArray(saved.chapters) ? saved.chapters : (initialMatch?.chapters || []),
      tasks: Array.isArray(saved.tasks) ? saved.tasks : (initialMatch?.tasks || []),
      timeline: Array.isArray(saved.timeline) ? saved.timeline : (initialMatch?.timeline || []),
      linkedPaperIds: Array.isArray(saved.linkedPaperIds) ? saved.linkedPaperIds : (initialMatch?.linkedPaperIds || []),
    } as ResearchJourney;
    byId.set(saved.id as string, normalised);
  }

  const items: WorkProductResearchJourney[] = Array.from(byId.entries()).map(([id, payload]) => {
    const existing = existingById.get(id);
    return {
      id,
      kind: 'research_journey',
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
      payload,
    };
  });

  return { items, succeeded: true, skippedCount };
}

export interface PublishingRawFields {
  docTitle: string | null;
  draftContent: string | null;
  outline: string | null;
  notes: string | null;
  checklist: string | null;
  importedDocs: string | null;
  journalTargetId: string | null;
  customTargetWords: string | null;
}

function parseJsonArrayField<T>(raw: string | null, fieldLabel: string, sampleFallback: T[] = []): T[] {
  if (raw === null) return sampleFallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
    console.warn(`[WorkProduct migration] pub_${fieldLabel} was valid JSON but not an array; treating as empty.`);
    return [];
  } catch {
    console.warn(`[WorkProduct migration] pub_${fieldLabel} could not be parsed as JSON; treating as empty.`);
    return [];
  }
}

/**
 * Pure. Always produces a publishing_draft WorkProduct (see module doc
 * comment) -- there is no "whole group failed" case for publishing.
 *
 * pub_doc_title, pub_journal_target_id and pub_custom_target_words fall
 * back to the exact same short literal defaults
 * CreativePublishingWorkspace.tsx itself already uses when a key is absent
 * ('Untitled Scholarly Monograph', 'std_article', 3500).
 *
 * The other five fields (pub_draft_content, pub_outline, pub_notes,
 * pub_checklist, pub_imported_docs) fall back to a genuinely empty value
 * UNLESS useSampleContentForAbsentFields is true AND the corresponding raw
 * legacy key was never persisted at all (raw.X === null) -- in which case
 * they fall back to CreativePublishingWorkspace.tsx's existing first-run
 * sample content (the sample essay / seed outline / seed notes / seed
 * checklist / seed imported doc), imported from that file rather than
 * duplicated here. This distinction matters: a legacy key that WAS
 * persisted but is empty or malformed still migrates to a genuinely empty
 * value either way -- only "never touched at all" gets the samples. This
 * preserves the Publishing Workspace's pre-Stage-3 first-run behaviour
 * (docs/WORK-LOG.md, "preserve existing Publishing Workspace sample/
 * default content" decision) without creating a second, divergent copy of
 * that sample content: it is stored once, into the canonical
 * publishing_draft WorkProduct, the first time initializeWorkProducts()
 * runs with no pre-existing pub_* data.
 *
 * The flag defaults to false, so runWorkProductMigration() and all
 * existing callers/tests of this function are unaffected -- only
 * initializeWorkProducts()'s one-time legacy-import path passes true.
 */
export function parseLegacyPublishing(
  raw: PublishingRawFields,
  nowIso: string,
  existing: WorkProductPublishingDraft | undefined,
  useSampleContentForAbsentFields: boolean = false
): WorkProductPublishingDraft {
  const parsedTargetWords = raw.customTargetWords !== null ? parseInt(raw.customTargetWords, 10) : NaN;
  const useSamples = useSampleContentForAbsentFields;

  const payload: PublishingDraftPayload = {
    docTitle: raw.docTitle ?? 'Untitled Scholarly Monograph',
    draftContent: raw.draftContent ?? (useSamples ? SAMPLE_DRAFT_CONTENT : ''),
    outline: parseJsonArrayField<OutlineItem>(raw.outline, 'outline', useSamples ? DEFAULT_OUTLINE : []),
    notes: parseJsonArrayField<NoteCard>(raw.notes, 'notes', useSamples ? INITIAL_NOTES : []),
    checklist: parseJsonArrayField<PublisherChecklistItem>(raw.checklist, 'checklist', useSamples ? DEFAULT_CHECKLIST : []),
    importedDocs: parseJsonArrayField<ImportedDocument>(raw.importedDocs, 'imported_docs', useSamples ? DEFAULT_IMPORTED_DOCS : []),
    journalTargetId: raw.journalTargetId ?? 'std_article',
    customTargetWords: Number.isFinite(parsedTargetWords) ? parsedTargetWords : 3500,
  };

  return {
    id: PUBLISHING_DRAFT_ID,
    kind: 'publishing_draft',
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    payload,
  };
}

/**
 * Pure. Given the current WorkProduct[] and freshly-derived group results,
 * produces the merged, replacement WorkProduct[]. A kind-group's existing
 * entries are only replaced when that group's migration succeeded; a
 * failed group (malformed top-level source) is carried over unchanged.
 */
export function mergeWorkProducts(
  current: WorkProduct[],
  papers: GroupMigrationResult<WorkProductPaper>,
  journeys: GroupMigrationResult<WorkProductResearchJourney>,
  publishing: WorkProductPublishingDraft
): WorkProduct[] {
  const paperEntries: WorkProductPaper[] = papers.succeeded
    ? papers.items
    : current.filter((wp): wp is WorkProductPaper => wp.kind === 'paper');
  const journeyEntries: WorkProductResearchJourney[] = journeys.succeeded
    ? journeys.items
    : current.filter((wp): wp is WorkProductResearchJourney => wp.kind === 'research_journey');

  return [...paperEntries, ...journeyEntries, publishing];
}

function readCurrentWorkProducts(): WorkProduct[] {
  try {
    const raw = localStorage.getItem(WORK_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => isPlainObject(item) && typeof item.id === 'string' && typeof item.kind === 'string'
    ) as WorkProduct[];
  } catch (error) {
    console.warn('[WorkProduct migration] Failed to read existing pessoa_work_products; treating as empty.', error);
    return [];
  }
}

/** Read-only accessor for pessoa_work_products. Never throws; returns []
 * if the key is absent or malformed. Does not run migration. */
export function readWorkProducts(): WorkProduct[] {
  return readCurrentWorkProducts();
}

export interface MigrationSummary {
  workProducts: WorkProduct[];
  papersSucceeded: boolean;
  journeysSucceeded: boolean;
  papersSkipped: number;
  journeysSkipped: number;
}

/**
 * Runs the Stage 2 migration: reads the legacy scholar_papers,
 * scholar_journeys and pub_* keys, and additively writes their
 * WorkProduct representation to pessoa_work_products. Never deletes or
 * modifies any legacy key. Safe to call on every app load -- see the
 * module doc comment for why this neither creates duplicates nor
 * regresses createdAt.
 */
export function runWorkProductMigration(useSampleContentForAbsentPublishingFields: boolean = false): MigrationSummary {
  const nowIso = new Date().toISOString();
  const current = readCurrentWorkProducts();

  const existingPapersById = new Map<string, WorkProductPaper>(
    current.filter((wp): wp is WorkProductPaper => wp.kind === 'paper').map((wp) => [wp.id, wp])
  );
  const existingJourneysById = new Map<string, WorkProductResearchJourney>(
    current.filter((wp): wp is WorkProductResearchJourney => wp.kind === 'research_journey').map((wp) => [wp.id, wp])
  );
  const existingPublishing = current.find(
    (wp): wp is WorkProductPublishingDraft => wp.kind === 'publishing_draft'
  );

  const papersRaw = localStorage.getItem('scholar_papers');
  const journeysRaw = localStorage.getItem('scholar_journeys');
  const publishingRaw: PublishingRawFields = {
    docTitle: localStorage.getItem('pub_doc_title'),
    draftContent: localStorage.getItem('pub_draft_content'),
    outline: localStorage.getItem('pub_outline'),
    notes: localStorage.getItem('pub_notes'),
    checklist: localStorage.getItem('pub_checklist'),
    importedDocs: localStorage.getItem('pub_imported_docs'),
    journalTargetId: localStorage.getItem('pub_journal_target_id'),
    customTargetWords: localStorage.getItem('pub_custom_target_words'),
  };

  const papers = parseLegacyPapers(papersRaw, nowIso, existingPapersById);
  const journeys = parseLegacyJourneys(journeysRaw, nowIso, existingJourneysById);
  const publishing = parseLegacyPublishing(publishingRaw, nowIso, existingPublishing, useSampleContentForAbsentPublishingFields);

  if (!papers.succeeded) {
    console.warn(
      '[WorkProduct migration] scholar_papers could not be parsed as an array; leaving existing paper WorkProducts untouched and legacy data unmodified. Will retry next run.'
    );
  }
  if (papers.skippedCount > 0) {
    console.warn(`[WorkProduct migration] Skipped ${papers.skippedCount} paper record(s) without a valid id.`);
  }
  if (!journeys.succeeded) {
    console.warn(
      '[WorkProduct migration] scholar_journeys could not be parsed as an array; leaving existing research_journey WorkProducts untouched and legacy data unmodified. Will retry next run.'
    );
  }
  if (journeys.skippedCount > 0) {
    console.warn(`[WorkProduct migration] Skipped ${journeys.skippedCount} journey record(s) without a valid id.`);
  }

  const merged = mergeWorkProducts(current, papers, journeys, publishing);

  try {
    localStorage.setItem(WORK_PRODUCTS_KEY, JSON.stringify(merged));
  } catch (error) {
    // Write failed (e.g. storage quota). Not treated as fatal, and no
    // legacy key is touched -- the next run simply tries the write again.
    console.warn('[WorkProduct migration] Failed to write pessoa_work_products.', error);
  }

  return {
    workProducts: merged,
    papersSucceeded: papers.succeeded,
    journeysSucceeded: journeys.succeeded,
    papersSkipped: papers.skippedCount,
    journeysSkipped: journeys.skippedCount,
  };
}

/**
 * Stage 3 -- one-time initialization / legacy import.
 *
 * If pessoa_work_products already exists, it is now canonical live state
 * (see src/lib/workProductStore.ts) and is simply returned as-is -- it is
 * NOT re-derived from the legacy scholar_papers / scholar_journeys / pub_*
 * keys, because doing so on every load would overwrite live in-session
 * edits with stale legacy data (this is the exact split-source problem
 * the Stage 2 -> Stage 3 transition exists to resolve).
 *
 * If pessoa_work_products does not exist yet (the very first load after
 * this code ships, or any environment where it was never created), this
 * runs the same legacy-import logic as runWorkProductMigration() exactly
 * once, against an empty `current` set, to seed canonical state from
 * whatever legacy data exists -- passing useSampleContentForAbsentPublishingFields
 * = true, so that if the pub_* keys were never persisted at all, the
 * canonical publishing_draft WorkProduct is seeded with
 * CreativePublishingWorkspace.tsx's existing first-run sample content
 * (docs/WORK-LOG.md, "preserve existing Publishing Workspace sample/
 * default content" decision), stored once as real canonical data rather
 * than left for the component to fabricate locally on every mount.
 * Subsequent calls are no-ops (they will find pessoa_work_products already
 * present and simply return it).
 *
 * This function never re-derives papers/journeys/publishing from legacy
 * keys once pessoa_work_products exists -- that is the intended meaning
 * of "initialisation/legacy import, not an ongoing synchronisation
 * mechanism" (docs/DECISIONS.md).
 */
export function initializeWorkProducts(): WorkProduct[] {
  const alreadyInitialized = localStorage.getItem(WORK_PRODUCTS_KEY) !== null;
  if (alreadyInitialized) {
    return readCurrentWorkProducts();
  }

  console.log('[WorkProduct init] pessoa_work_products not found; importing from legacy keys once.');
  const summary = runWorkProductMigration(true);
  return summary.workProducts;
}
