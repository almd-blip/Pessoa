/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the Stage 2 WorkProduct migration (src/lib/workProductMigration.ts).
 *
 * Uses only the Node built-in test runner (node:test / node:assert) --
 * no new test-framework dependency was added for this. Run with:
 *
 *   npx tsx --test src/lib/workProductMigration.test.ts
 *
 * The pure parseLegacyPapers / parseLegacyJourneys / parseLegacyPublishing /
 * mergeWorkProducts functions need no localStorage at all.
 * runWorkProductMigration/readWorkProducts do touch localStorage
 * (a browser global), so this file provides a minimal in-memory
 * localStorage stand-in, used only here, never shipped in application code.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLegacyPapers,
  parseLegacyJourneys,
  parseLegacyPublishing,
  mergeWorkProducts,
  runWorkProductMigration,
  initializeWorkProducts,
  readWorkProducts,
  WORK_PRODUCTS_KEY,
  PUBLISHING_DRAFT_ID,
  PublishingRawFields,
} from './workProductMigration';
import { WorkProductPaper, WorkProductResearchJourney } from '../types/workProduct';
import {
  SAMPLE_DRAFT_CONTENT,
  DEFAULT_OUTLINE,
  INITIAL_NOTES,
  DEFAULT_CHECKLIST,
  DEFAULT_IMPORTED_DOCS,
} from '../components/CreativePublishingWorkspace';

// ----------------- test-only localStorage stand-in -----------------

class FakeLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: FakeLocalStorage }).localStorage = new FakeLocalStorage();
});

const emptyPublishingRaw: PublishingRawFields = {
  docTitle: null,
  draftContent: null,
  outline: null,
  notes: null,
  checklist: null,
  importedDocs: null,
  journalTargetId: null,
  customTargetWords: null,
};

// ----------------- parseLegacyPapers -----------------

describe('parseLegacyPapers', () => {
  test('valid Paper[] migrates one WorkProduct per paper, preserving ids', () => {
    const raw = JSON.stringify([
      { id: 'paper-1', title: 'A', authors: 'X', year: 2020 },
      { id: 'paper-2', title: 'B', authors: 'Y', year: 2021 },
    ]);
    const result = parseLegacyPapers(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, true);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].id, 'paper-1');
    assert.equal(result.items[0].kind, 'paper');
    assert.equal(result.items[0].payload.title, 'A');
    assert.equal(result.items[1].id, 'paper-2');
  });

  test('empty array migrates successfully with zero items', () => {
    const result = parseLegacyPapers('[]', '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, true);
    assert.equal(result.items.length, 0);
  });

  test('absent key (null) is treated as a successful empty migration, not a failure', () => {
    const result = parseLegacyPapers(null, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, true);
    assert.equal(result.items.length, 0);
  });

  test('malformed JSON fails the whole group without throwing', () => {
    const result = parseLegacyPapers('{not valid json', '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, false);
    assert.equal(result.items.length, 0);
  });

  test('valid JSON that is not an array fails the whole group', () => {
    const result = parseLegacyPapers('{"id":"not-an-array"}', '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, false);
  });

  test('a record missing a valid id is skipped, not fatal to the group', () => {
    const raw = JSON.stringify([
      { id: 'paper-1', title: 'Good' },
      { title: 'No id at all' },
      { id: 123, title: 'Numeric id, invalid' },
      { id: '', title: 'Empty string id, invalid' },
    ]);
    const result = parseLegacyPapers(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, true);
    assert.equal(result.items.length, 1);
    assert.equal(result.skippedCount, 3);
  });

  test('mixed valid/invalid records: valid ones still migrate', () => {
    const raw = JSON.stringify([
      { id: 'p1', title: 'Valid one' },
      null,
      { id: 'p2', title: 'Valid two' },
      'just a string, not an object',
    ]);
    const result = parseLegacyPapers(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.items.length, 2);
    assert.equal(result.skippedCount, 2);
  });

  test('duplicate ids: last occurrence wins, only one WorkProduct produced', () => {
    const raw = JSON.stringify([
      { id: 'dup', title: 'First (should be overwritten)' },
      { id: 'dup', title: 'Second (should win)' },
    ]);
    const result = parseLegacyPapers(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].payload.title, 'Second (should win)');
  });

  test('unknown/extra fields on a record are preserved into the payload', () => {
    const raw = JSON.stringify([
      { id: 'p1', title: 'A', someFutureFieldNotInCurrentInterface: 'kept' },
    ]);
    const result = parseLegacyPapers(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal((result.items[0].payload as any).someFutureFieldNotInCurrentInterface, 'kept');
  });

  test('partially populated record (missing optional fields) migrates fine', () => {
    const raw = JSON.stringify([{ id: 'p1', title: 'Only id and title' }]);
    const result = parseLegacyPapers(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].payload.title, 'Only id and title');
  });

  test('createdAt is preserved from an existing WorkProduct with the same id; updatedAt refreshes', () => {
    const existing = new Map<string, WorkProductPaper>([
      [
        'p1',
        {
          id: 'p1',
          kind: 'paper',
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
          payload: { id: 'p1', title: 'Old' } as any,
        },
      ],
    ]);
    const raw = JSON.stringify([{ id: 'p1', title: 'Updated title' }]);
    const result = parseLegacyPapers(raw, '2026-06-01T00:00:00.000Z', existing);
    assert.equal(result.items[0].createdAt, '2020-01-01T00:00:00.000Z');
    assert.equal(result.items[0].updatedAt, '2026-06-01T00:00:00.000Z');
  });
});

// ----------------- parseLegacyJourneys -----------------

describe('parseLegacyJourneys', () => {
  test('valid ResearchJourney[] preserves nested chapters/tasks/timeline/linkedPaperIds', () => {
    const raw = JSON.stringify([
      {
        id: 'j1',
        title: 'My Journey',
        chapters: [{ id: 'ch1', title: 'Chapter One' }],
        tasks: [{ id: 't1', title: 'Task One', completed: false }],
        timeline: [{ id: 'te1', label: 'Milestone', date: '2025-01-01' }],
        questions: ['What is the effect of X?'],
        linkedPaperIds: ['paper-1', 'paper-2'],
      },
    ]);
    const result = parseLegacyJourneys(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, true);
    assert.equal(result.items.length, 1);
    const payload = result.items[0].payload as any;
    assert.deepEqual(payload.chapters, [{ id: 'ch1', title: 'Chapter One' }]);
    assert.deepEqual(payload.tasks, [{ id: 't1', title: 'Task One', completed: false }]);
    assert.deepEqual(payload.timeline, [{ id: 'te1', label: 'Milestone', date: '2025-01-01' }]);
    assert.deepEqual(payload.linkedPaperIds, ['paper-1', 'paper-2']);
    assert.deepEqual(payload.questions, ['What is the effect of X?']);
  });

  test('missing nested arrays fall back to [] (or a matching INITIAL_JOURNEYS seed), never crash', () => {
    const raw = JSON.stringify([{ id: 'brand-new-journey-not-in-seed-data', title: 'No nested data at all' }]);
    const result = parseLegacyJourneys(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.items.length, 1);
    const payload = result.items[0].payload as any;
    assert.deepEqual(payload.chapters, []);
    assert.deepEqual(payload.tasks, []);
    assert.deepEqual(payload.timeline, []);
    assert.deepEqual(payload.questions, []);
    assert.deepEqual(payload.linkedPaperIds, []);
  });

  test('empty array migrates successfully with zero items', () => {
    const result = parseLegacyJourneys('[]', '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, true);
    assert.equal(result.items.length, 0);
  });

  test('malformed JSON fails the whole group', () => {
    const result = parseLegacyJourneys('not json at all {{{', '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.succeeded, false);
  });

  test('record without a valid id is skipped', () => {
    const raw = JSON.stringify([{ title: 'No id' }, { id: 'j1', title: 'Has id' }]);
    const result = parseLegacyJourneys(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.items.length, 1);
    assert.equal(result.skippedCount, 1);
  });

  test('duplicate ids: last occurrence wins', () => {
    const raw = JSON.stringify([
      { id: 'dup', title: 'First' },
      { id: 'dup', title: 'Second' },
    ]);
    const result = parseLegacyJourneys(raw, '2026-01-01T00:00:00.000Z', new Map());
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].payload.title, 'Second');
  });

  test('createdAt preserved across runs via existingById lookup', () => {
    const existing = new Map<string, WorkProductResearchJourney>([
      [
        'j1',
        {
          id: 'j1',
          kind: 'research_journey',
          createdAt: '2019-05-05T00:00:00.000Z',
          updatedAt: '2019-05-05T00:00:00.000Z',
          payload: { id: 'j1', title: 'Old' } as any,
        },
      ],
    ]);
    const raw = JSON.stringify([{ id: 'j1', title: 'New title' }]);
    const result = parseLegacyJourneys(raw, '2026-06-01T00:00:00.000Z', existing);
    assert.equal(result.items[0].createdAt, '2019-05-05T00:00:00.000Z');
    assert.equal(result.items[0].updatedAt, '2026-06-01T00:00:00.000Z');
  });
});

// ----------------- parseLegacyPublishing -----------------

describe('parseLegacyPublishing', () => {
  test('complete publishing workspace migrates every field', () => {
    const raw: PublishingRawFields = {
      docTitle: 'My Monograph',
      draftContent: 'Once upon a time...',
      outline: JSON.stringify([{ id: 'o1', title: 'Intro', level: 1, completed: false }]),
      notes: JSON.stringify([{ id: 'n1', title: 'Note', content: 'text', tags: [], updatedAt: '2025-01-01' }]),
      checklist: JSON.stringify([{ id: 'c1', label: 'Check', description: 'd', category: 'formatting', completed: false }]),
      importedDocs: JSON.stringify([{ id: 'd1', title: 'Doc', fileName: 'x.pdf', fileType: 'pdf', sizeBytes: 100, wordCount: 10 }]),
      journalTargetId: 'nature_style',
      customTargetWords: '8000',
    };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.id, PUBLISHING_DRAFT_ID);
    assert.equal(result.kind, 'publishing_draft');
    assert.equal(result.payload.docTitle, 'My Monograph');
    assert.equal(result.payload.draftContent, 'Once upon a time...');
    assert.equal(result.payload.outline.length, 1);
    assert.equal(result.payload.notes.length, 1);
    assert.equal(result.payload.checklist.length, 1);
    assert.equal(result.payload.importedDocs.length, 1);
    assert.equal(result.payload.journalTargetId, 'nature_style');
    assert.equal(result.payload.customTargetWords, 8000);
  });

  test('partially populated publishing workspace: missing keys degrade to documented defaults', () => {
    const raw: PublishingRawFields = { ...emptyPublishingRaw, docTitle: 'Only the title is set' };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.payload.docTitle, 'Only the title is set');
    assert.equal(result.payload.draftContent, '');
    assert.deepEqual(result.payload.outline, []);
    assert.deepEqual(result.payload.notes, []);
    assert.deepEqual(result.payload.checklist, []);
    assert.deepEqual(result.payload.importedDocs, []);
    assert.equal(result.payload.journalTargetId, 'std_article');
    assert.equal(result.payload.customTargetWords, 3500);
  });

  test('entirely absent publishing workspace still produces one WorkProduct with defaults', () => {
    const result = parseLegacyPublishing(emptyPublishingRaw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.kind, 'publishing_draft');
    assert.equal(result.payload.docTitle, 'Untitled Scholarly Monograph');
  });

  test('raw-string fields (docTitle, draftContent) are read as plain strings, never JSON.parsed', () => {
    const raw: PublishingRawFields = {
      ...emptyPublishingRaw,
      docTitle: 'Not JSON, just text: {not an object',
      draftContent: 'Also plain text, with "quotes" and [brackets]',
    };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.payload.docTitle, 'Not JSON, just text: {not an object');
    assert.equal(result.payload.draftContent, 'Also plain text, with "quotes" and [brackets]');
  });

  test('malformed JSON in one array field degrades only that field, not the whole record', () => {
    const raw: PublishingRawFields = {
      ...emptyPublishingRaw,
      docTitle: 'Title survives',
      outline: '{not valid json[[[',
    };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.payload.docTitle, 'Title survives');
    assert.deepEqual(result.payload.outline, []);
  });

  test('non-numeric customTargetWords falls back to the documented default', () => {
    const raw: PublishingRawFields = { ...emptyPublishingRaw, customTargetWords: 'not-a-number' };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.payload.customTargetWords, 3500);
  });

  test('createdAt preserved across runs for the single publishing record', () => {
    const existing = {
      id: PUBLISHING_DRAFT_ID,
      kind: 'publishing_draft' as const,
      createdAt: '2018-01-01T00:00:00.000Z',
      updatedAt: '2018-01-01T00:00:00.000Z',
      payload: { docTitle: 'Old', draftContent: '', outline: [], notes: [], checklist: [], importedDocs: [], journalTargetId: 'std_article', customTargetWords: 3500 },
    };
    const result = parseLegacyPublishing(emptyPublishingRaw, '2026-06-01T00:00:00.000Z', existing);
    assert.equal(result.createdAt, '2018-01-01T00:00:00.000Z');
    assert.equal(result.updatedAt, '2026-06-01T00:00:00.000Z');
  });

  // ----- useSampleContentForAbsentFields (docs/WORK-LOG.md: "preserve
  // existing Publishing Workspace sample/default content" decision) -----

  test('useSampleContentForAbsentFields=false (the default) still produces genuinely empty values for entirely absent fields -- unchanged from before this decision', () => {
    const result = parseLegacyPublishing(emptyPublishingRaw, '2026-01-01T00:00:00.000Z', undefined);
    assert.equal(result.payload.draftContent, '');
    assert.deepEqual(result.payload.outline, []);
    assert.deepEqual(result.payload.notes, []);
    assert.deepEqual(result.payload.checklist, []);
    assert.deepEqual(result.payload.importedDocs, []);
  });

  test('useSampleContentForAbsentFields=true with every field absent restores the exact existing first-run sample content', () => {
    const result = parseLegacyPublishing(emptyPublishingRaw, '2026-01-01T00:00:00.000Z', undefined, true);
    assert.equal(result.payload.draftContent, SAMPLE_DRAFT_CONTENT);
    assert.deepEqual(result.payload.outline, DEFAULT_OUTLINE);
    assert.deepEqual(result.payload.notes, INITIAL_NOTES);
    assert.deepEqual(result.payload.checklist, DEFAULT_CHECKLIST);
    assert.deepEqual(result.payload.importedDocs, DEFAULT_IMPORTED_DOCS);
  });

  test('useSampleContentForAbsentFields=true does NOT override a field that was genuinely persisted (even as an empty value)', () => {
    const raw: PublishingRawFields = {
      ...emptyPublishingRaw,
      draftContent: '', // explicitly persisted as an empty string, not absent
      outline: '[]', // explicitly persisted as an empty array, not absent
    };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined, true);
    assert.equal(result.payload.draftContent, '');
    assert.deepEqual(result.payload.outline, []);
  });

  test('useSampleContentForAbsentFields=true does NOT use the sample for a malformed (not absent) field', () => {
    const raw: PublishingRawFields = { ...emptyPublishingRaw, outline: '{not valid json[[[' };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined, true);
    // Malformed is not the same as "never persisted" -- must not silently
    // become the sample content either.
    assert.deepEqual(result.payload.outline, []);
  });

  test('useSampleContentForAbsentFields=true still respects a genuinely persisted, non-empty value', () => {
    const raw: PublishingRawFields = { ...emptyPublishingRaw, draftContent: 'A real user draft' };
    const result = parseLegacyPublishing(raw, '2026-01-01T00:00:00.000Z', undefined, true);
    assert.equal(result.payload.draftContent, 'A real user draft');
  });
});

// ----------------- mergeWorkProducts -----------------

describe('mergeWorkProducts', () => {
  test('successful groups replace their kind; failed groups carry over unchanged', () => {
    const existingPaper: WorkProductPaper = {
      id: 'old-paper',
      kind: 'paper',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
      payload: { id: 'old-paper', title: 'Untouched because papers group failed this run' } as any,
    };
    const current = [existingPaper];

    const failedPapers = { items: [], succeeded: false, skippedCount: 0 };
    const succeededJourneys = {
      items: [
        {
          id: 'j1',
          kind: 'research_journey' as const,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          payload: { id: 'j1', title: 'New' } as any,
        },
      ],
      succeeded: true,
      skippedCount: 0,
    };
    const publishing = {
      id: PUBLISHING_DRAFT_ID,
      kind: 'publishing_draft' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      payload: { docTitle: 'D', draftContent: '', outline: [], notes: [], checklist: [], importedDocs: [], journalTargetId: 'std_article', customTargetWords: 3500 },
    };

    const merged = mergeWorkProducts(current, failedPapers as any, succeededJourneys as any, publishing);

    // Papers group failed -> the pre-existing paper WorkProduct must survive untouched.
    assert.equal(merged.some((wp) => wp.id === 'old-paper'), true);
    // Journeys group succeeded -> the new journey WorkProduct is present.
    assert.equal(merged.some((wp) => wp.id === 'j1'), true);
    // Publishing is always present.
    assert.equal(merged.some((wp) => wp.id === PUBLISHING_DRAFT_ID), true);
  });
});

// ----------------- runWorkProductMigration (localStorage-touching wrapper) -----------------

describe('runWorkProductMigration', () => {
  test('round-trip: legacy localStorage -> WorkProduct[] -> readWorkProducts, no data loss', () => {
    localStorage.setItem('scholar_papers', JSON.stringify([{ id: 'p1', title: 'Round trip paper', authors: 'A' }]));
    localStorage.setItem(
      'scholar_journeys',
      JSON.stringify([{ id: 'j1', title: 'Round trip journey', chapters: [], tasks: [], timeline: [], questions: [], linkedPaperIds: [] }])
    );
    localStorage.setItem('pub_doc_title', 'Round trip doc');

    const summary = runWorkProductMigration();
    assert.equal(summary.papersSucceeded, true);
    assert.equal(summary.journeysSucceeded, true);

    const stored = readWorkProducts();
    const paper = stored.find((wp) => wp.kind === 'paper');
    const journey = stored.find((wp) => wp.kind === 'research_journey');
    const publishing = stored.find((wp) => wp.kind === 'publishing_draft');

    assert.equal((paper?.payload as any).title, 'Round trip paper');
    assert.equal((journey?.payload as any).title, 'Round trip journey');
    assert.equal((publishing?.payload as any).docTitle, 'Round trip doc');

    // Legacy keys must be untouched (additive migration, never destructive).
    assert.equal(localStorage.getItem('scholar_papers'), JSON.stringify([{ id: 'p1', title: 'Round trip paper', authors: 'A' }]));
  });

  test('idempotency: running twice with unchanged legacy data does not duplicate WorkProducts', () => {
    localStorage.setItem('scholar_papers', JSON.stringify([{ id: 'p1', title: 'Only once' }]));

    runWorkProductMigration();
    runWorkProductMigration();

    const stored = readWorkProducts();
    const matchingPapers = stored.filter((wp) => wp.kind === 'paper' && wp.id === 'p1');
    assert.equal(matchingPapers.length, 1);
  });

  test('identity: createdAt is stable across repeated runs; updatedAt may advance', async () => {
    localStorage.setItem('scholar_papers', JSON.stringify([{ id: 'p1', title: 'Stable id' }]));

    runWorkProductMigration();
    const firstRun = readWorkProducts().find((wp) => wp.id === 'p1')!;

    // Small delay so a second run would get a distinguishable timestamp if
    // it were to change createdAt (it must not).
    await new Promise((resolve) => setTimeout(resolve, 5));

    runWorkProductMigration();
    const secondRun = readWorkProducts().find((wp) => wp.id === 'p1')!;

    assert.equal(secondRun.createdAt, firstRun.createdAt);
    assert.equal(secondRun.id, firstRun.id);
  });

  test('failure safety: malformed scholar_papers leaves the legacy key untouched and does not delete previously-migrated papers', () => {
    // First, a valid migration run establishes a baseline WorkProduct.
    localStorage.setItem('scholar_papers', JSON.stringify([{ id: 'p1', title: 'Established first' }]));
    runWorkProductMigration();
    assert.equal(readWorkProducts().some((wp) => wp.id === 'p1'), true);

    // Now the legacy key becomes corrupted (e.g. a bad write from elsewhere).
    localStorage.setItem('scholar_papers', '{{{not valid json');
    const summary = runWorkProductMigration();

    assert.equal(summary.papersSucceeded, false);
    // The legacy source itself is untouched (still the corrupted string --
    // migration must never "fix" or overwrite it either).
    assert.equal(localStorage.getItem('scholar_papers'), '{{{not valid json');
    // The previously-migrated paper WorkProduct must still be present.
    assert.equal(readWorkProducts().some((wp) => wp.id === 'p1'), true);
  });

  test('a publishing_draft WorkProduct is always created even with no publishing data at all', () => {
    runWorkProductMigration();
    const stored = readWorkProducts();
    assert.equal(stored.some((wp) => wp.kind === 'publishing_draft'), true);
  });

  test('writes to the documented storage key', () => {
    runWorkProductMigration();
    assert.equal(WORK_PRODUCTS_KEY, 'pessoa_work_products');
    assert.notEqual(localStorage.getItem(WORK_PRODUCTS_KEY), null);
  });

  test('runWorkProductMigration(true) uses sample content for absent publishing fields; the default (no argument) does not', () => {
    const withSamples = runWorkProductMigration(true);
    const publishingWithSamples = withSamples.workProducts.find((wp) => wp.kind === 'publishing_draft');
    assert.equal((publishingWithSamples?.payload as any).draftContent, SAMPLE_DRAFT_CONTENT);

    localStorage.clear();
    const withoutSamples = runWorkProductMigration();
    const publishingWithoutSamples = withoutSamples.workProducts.find((wp) => wp.kind === 'publishing_draft');
    assert.equal((publishingWithoutSamples?.payload as any).draftContent, '');
  });
});

// ----------------- initializeWorkProducts (Stage 3 live entry point) -----------------

describe('initializeWorkProducts', () => {
  test('on a genuinely fresh environment (no pessoa_work_products, no legacy keys at all), restores the existing Publishing Workspace sample content', () => {
    const result = initializeWorkProducts();
    const publishing = result.find((wp) => wp.kind === 'publishing_draft');
    assert.equal((publishing?.payload as any).draftContent, SAMPLE_DRAFT_CONTENT);
    assert.deepEqual((publishing?.payload as any).outline, DEFAULT_OUTLINE);
    assert.deepEqual((publishing?.payload as any).notes, INITIAL_NOTES);
    assert.deepEqual((publishing?.payload as any).checklist, DEFAULT_CHECKLIST);
    assert.deepEqual((publishing?.payload as any).importedDocs, DEFAULT_IMPORTED_DOCS);
  });

  test('once pessoa_work_products exists, subsequent calls do not re-derive from legacy state (no ongoing synchronisation)', () => {
    const first = initializeWorkProducts();
    // Simulate a live edit having happened after initialization -- direct
    // localStorage manipulation stands in for what saveWorkProducts would
    // do after a canonical-state mutation.
    const edited = first.map((wp) =>
      wp.kind === 'publishing_draft' ? { ...wp, payload: { ...wp.payload, draftContent: 'User has since edited this' } } : wp
    );
    localStorage.setItem(WORK_PRODUCTS_KEY, JSON.stringify(edited));

    // Even if legacy pub_draft_content now (hypothetically) held something
    // else, a second initializeWorkProducts() call must not overwrite the
    // live edit -- it should simply return existing canonical state.
    localStorage.setItem('pub_draft_content', 'Stale legacy value that must NOT reappear');
    const second = initializeWorkProducts();
    const publishing = second.find((wp) => wp.kind === 'publishing_draft');
    assert.equal((publishing?.payload as any).draftContent, 'User has since edited this');
  });

  test('a legacy field that was genuinely persisted (even if later emptied) is never overwritten by the sample content', () => {
    localStorage.setItem('pub_draft_content', 'A real, if short, draft');
    const result = initializeWorkProducts();
    const publishing = result.find((wp) => wp.kind === 'publishing_draft');
    assert.equal((publishing?.payload as any).draftContent, 'A real, if short, draft');
  });
});
