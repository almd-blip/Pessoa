/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stage 3 -- canonical WorkProduct state store.
 *
 * See docs/DECISIONS.md and the approved Stage 3 Live WorkProduct
 * Architecture Proposal for the governing design.
 *
 * This module is the ongoing counterpart to src/lib/workProductMigration.ts's
 * one-time initializeWorkProducts(): once App.tsx holds WorkProduct[] as its
 * canonical live state, every mutation (paper/journey create-update-delete,
 * publishing field changes, publishing notes) goes through one of the pure
 * functions below, which App.tsx applies via setWorkProducts(...). This is
 * deliberately the same "single choke point per entity" pattern that
 * already existed for Papers and Research Journeys before this change
 * (handleUpdatePaper/handleAddPaper/handleDeletePaper and their journey
 * equivalents) -- it is not new architecture, just the existing pattern
 * extended to update canonical WorkProduct[] instead of two separate
 * Paper[]/ResearchJourney[] state variables.
 *
 * All functions here are pure (WorkProduct[] in, WorkProduct[] out) so they
 * can be unit-tested directly in Node, matching workProductMigration.ts's
 * existing convention. Only saveWorkProducts() touches localStorage.
 */

import { Paper, ResearchJourney } from '../types';
import { NoteCard } from '../components/CreativePublishingWorkspace';
import {
  WorkProduct,
  WorkProductPaper,
  WorkProductResearchJourney,
  WorkProductPublishingDraft,
  PublishingDraftPayload,
} from '../types/workProduct';
import { WORK_PRODUCTS_KEY, PUBLISHING_DRAFT_ID, parseLegacyPublishing } from './workProductMigration';

function nowIso(): string {
  return new Date().toISOString();
}

// ----------------- persistence adapter -----------------

export interface SaveResult {
  ok: boolean;
  error?: unknown;
}

/**
 * The only function in this module that touches localStorage. Deliberately
 * thin: it has no knowledge of `kind`, Paper, or ResearchJourney -- this is
 * the seam Stage 4 (storage-engine migration) can replace without the
 * application-level WorkProduct model changing at all.
 *
 * Does not throw. A failed write is reported via the return value rather
 * than silently treated as successful (docs: Stage 3 proposal, "Failure
 * and Consistency Model").
 */
export function saveWorkProducts(items: WorkProduct[]): SaveResult {
  try {
    localStorage.setItem(WORK_PRODUCTS_KEY, JSON.stringify(items));
    return { ok: true };
  } catch (error) {
    console.warn('[WorkProduct store] Failed to persist pessoa_work_products.', error);
    return { ok: false, error };
  }
}

// ----------------- papers -----------------

export function updatePaper(items: WorkProduct[], updated: Paper): WorkProduct[] {
  const timestamp = nowIso();
  return items.map((wp) =>
    wp.kind === 'paper' && wp.id === updated.id ? { ...wp, payload: updated, updatedAt: timestamp } : wp
  );
}

export function addPaper(items: WorkProduct[], added: Paper): WorkProduct[] {
  const timestamp = nowIso();
  const envelope: WorkProductPaper = { id: added.id, kind: 'paper', createdAt: timestamp, updatedAt: timestamp, payload: added };
  return [...items, envelope];
}

export function deletePaper(items: WorkProduct[], id: string): WorkProduct[] {
  return items.filter((wp) => !(wp.kind === 'paper' && wp.id === id));
}

// ----------------- research journeys -----------------

export function updateJourney(items: WorkProduct[], updated: ResearchJourney): WorkProduct[] {
  const timestamp = nowIso();
  return items.map((wp) =>
    wp.kind === 'research_journey' && wp.id === updated.id ? { ...wp, payload: updated, updatedAt: timestamp } : wp
  );
}

export function addJourney(items: WorkProduct[], added: ResearchJourney): WorkProduct[] {
  const timestamp = nowIso();
  const envelope: WorkProductResearchJourney = {
    id: added.id,
    kind: 'research_journey',
    createdAt: timestamp,
    updatedAt: timestamp,
    payload: added,
  };
  return [...items, envelope];
}

export function deleteJourney(items: WorkProduct[], id: string): WorkProduct[] {
  return items.filter((wp) => !(wp.kind === 'research_journey' && wp.id === id));
}

// ----------------- publishing -----------------

/**
 * Updates one or more fields of the single publishing_draft WorkProduct
 * (docs/DECISIONS.md, D6/D-011 -- there is exactly one). Used by
 * CreativePublishingWorkspace.tsx's consolidated persistence effect for
 * docTitle/draftContent/outline/checklist/importedDocs. Deliberately does
 * NOT include journalTargetId/customTargetWords or notes -- see
 * docs/WORK-LOG.md for why those are handled differently.
 */
export function updatePublishingFields(items: WorkProduct[], fields: Partial<PublishingDraftPayload>): WorkProduct[] {
  const timestamp = nowIso();
  return items.map((wp) =>
    wp.kind === 'publishing_draft' ? { ...wp, payload: { ...wp.payload, ...fields }, updatedAt: timestamp } : wp
  );
}

/**
 * A note as constructed by ResearchWellbeing.tsx's "save session intent as
 * a note" feature does not conform to the NoteCard interface (it uses
 * `category`/`createdAt` instead of `updatedAt` -- see docs/WORK-LOG.md).
 * This is a pre-existing shape discrepancy, neither introduced nor
 * resolved here: the object is preserved and stored exactly as given,
 * never normalised or have fields dropped/renamed.
 */
export type PublishingNoteInput = NoteCard | (Record<string, unknown> & { id: string });

/**
 * Prepends a note to the single publishing_draft WorkProduct's notes
 * array. This is the one shared choke point for the two existing note-
 * adding call sites (CreativePublishingWorkspace.tsx's own "add note"
 * button, and ResearchWellbeing.tsx's "save session intent as a note"
 * feature) -- the same "single handler, multiple callers" pattern already
 * used for Papers and Journeys, applied here because this field turned out
 * to have two independent callers (discovered during the Stage 3 mutation
 * inventory; see docs/WORK-LOG.md).
 */
export function addPublishingNote(items: WorkProduct[], note: PublishingNoteInput): WorkProduct[] {
  const timestamp = nowIso();
  return items.map((wp) =>
    wp.kind === 'publishing_draft'
      ? { ...wp, payload: { ...wp.payload, notes: [note as NoteCard, ...wp.payload.notes] }, updatedAt: timestamp }
      : wp
  );
}

// ----------------- reset / restore (used by App.tsx's existing "Reset All
// Data" and "Restore Demo Data" actions) -----------------

/**
 * Rebuilds the paper and research_journey WorkProducts from the given seed
 * arrays, and resets the publishing_draft WorkProduct to the same empty-
 * field defaults parseLegacyPublishing already produces for a fully absent
 * legacy publishing state (reused, not reimplemented, to keep exactly one
 * definition of those defaults).
 *
 * Used by App.tsx's handleResetAllData, which already clears localStorage
 * entirely -- this produces the in-memory canonical state that matches
 * what a fresh reload after that clear would have produced, made
 * immediately consistent instead of requiring a reload to "notice" it.
 */
export function resetWorkProductsToSeed(papersSeed: Paper[], journeysSeed: ResearchJourney[]): WorkProduct[] {
  const timestamp = nowIso();
  const paperEnvelopes: WorkProductPaper[] = papersSeed.map((payload) => ({
    id: payload.id,
    kind: 'paper',
    createdAt: timestamp,
    updatedAt: timestamp,
    payload,
  }));
  const journeyEnvelopes: WorkProductResearchJourney[] = journeysSeed.map((payload) => ({
    id: payload.id,
    kind: 'research_journey',
    createdAt: timestamp,
    updatedAt: timestamp,
    payload,
  }));
  const publishingEnvelope: WorkProductPublishingDraft = parseLegacyPublishing(
    {
      docTitle: null,
      draftContent: null,
      outline: null,
      notes: null,
      checklist: null,
      importedDocs: null,
      journalTargetId: null,
      customTargetWords: null,
    },
    timestamp,
    undefined
  );
  return [...paperEnvelopes, ...journeyEnvelopes, publishingEnvelope];
}

/**
 * Rebuilds ONLY the paper and research_journey WorkProducts from the given
 * seed arrays, leaving the existing publishing_draft entry in `current`
 * completely untouched. This preserves the pre-existing asymmetry: App.tsx's
 * "Restore Demo Data" action has never reset publishing state, only papers
 * and journeys -- see docs/WORK-LOG.md.
 */
export function restoreDemoPapersAndJourneys(
  current: WorkProduct[],
  papersSeed: Paper[],
  journeysSeed: ResearchJourney[]
): WorkProduct[] {
  const timestamp = nowIso();
  const paperEnvelopes: WorkProductPaper[] = papersSeed.map((payload) => ({
    id: payload.id,
    kind: 'paper',
    createdAt: timestamp,
    updatedAt: timestamp,
    payload,
  }));
  const journeyEnvelopes: WorkProductResearchJourney[] = journeysSeed.map((payload) => ({
    id: payload.id,
    kind: 'research_journey',
    createdAt: timestamp,
    updatedAt: timestamp,
    payload,
  }));
  const untouchedOther = current.filter((wp) => wp.kind !== 'paper' && wp.kind !== 'research_journey');
  return [...paperEnvelopes, ...journeyEnvelopes, ...untouchedOther];
}

// ----------------- selectors -----------------

const DEFAULT_PUBLISHING_PAYLOAD: PublishingDraftPayload = {
  docTitle: 'Untitled Scholarly Monograph',
  draftContent: '',
  outline: [],
  notes: [],
  checklist: [],
  importedDocs: [],
  journalTargetId: 'std_article',
  customTargetWords: 3500,
};

export function selectPapers(items: WorkProduct[]): Paper[] {
  return items.filter((wp): wp is WorkProductPaper => wp.kind === 'paper').map((wp) => wp.payload);
}

export function selectJourneys(items: WorkProduct[]): ResearchJourney[] {
  return items.filter((wp): wp is WorkProductResearchJourney => wp.kind === 'research_journey').map((wp) => wp.payload);
}

/**
 * There is always exactly one publishing_draft WorkProduct once
 * initializeWorkProducts() has run (docs/DECISIONS.md, D6/D-011), so this
 * fallback is not expected to be exercised in practice -- it exists only
 * for type-safety and defensive robustness, using the same default values
 * already established by parseLegacyPublishing's documented defaults.
 */
export function selectPublishingDraft(items: WorkProduct[]): PublishingDraftPayload {
  const found = items.find((wp): wp is WorkProductPublishingDraft => wp.kind === 'publishing_draft');
  return found ? found.payload : DEFAULT_PUBLISHING_PAYLOAD;
}
