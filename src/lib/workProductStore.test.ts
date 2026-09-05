/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the Stage 3 canonical WorkProduct store (src/lib/workProductStore.ts).
 *
 * Node built-in test runner only (node:test / node:assert via `tsx --test`)
 * -- no new test-framework dependency, matching workProductMigration.test.ts's
 * existing convention.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  updatePaper,
  addPaper,
  deletePaper,
  updateJourney,
  addJourney,
  deleteJourney,
  updatePublishingFields,
  addPublishingNote,
  resetWorkProductsToSeed,
  restoreDemoPapersAndJourneys,
  selectPapers,
  selectJourneys,
  selectPublishingDraft,
  saveWorkProducts,
} from './workProductStore';
import { WorkProduct, WorkProductPaper, WorkProductResearchJourney, WorkProductPublishingDraft } from '../types/workProduct';

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

function makePublishingDraft(overrides: Partial<WorkProductPublishingDraft['payload']> = {}): WorkProductPublishingDraft {
  return {
    id: 'publishing-draft-current',
    kind: 'publishing_draft',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    payload: {
      docTitle: 'D',
      draftContent: '',
      outline: [],
      notes: [],
      checklist: [],
      importedDocs: [],
      journalTargetId: 'std_article',
      customTargetWords: 3500,
      ...overrides,
    },
  };
}

// ----------------- papers -----------------

describe('paper mutations', () => {
  test('addPaper appends a new WorkProduct envelope', () => {
    const result = addPaper([], { id: 'p1', title: 'New paper' } as any);
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, 'paper');
    assert.equal(result[0].id, 'p1');
    assert.equal((result[0] as WorkProductPaper).payload.title, 'New paper');
  });

  test('updatePaper replaces only the matching paper, preserving createdAt', () => {
    const existing: WorkProductPaper = {
      id: 'p1',
      kind: 'paper',
      createdAt: '2019-01-01T00:00:00.000Z',
      updatedAt: '2019-01-01T00:00:00.000Z',
      payload: { id: 'p1', title: 'Old title' } as any,
    };
    const result = updatePaper([existing], { id: 'p1', title: 'New title' } as any);
    assert.equal(result.length, 1);
    assert.equal((result[0] as WorkProductPaper).payload.title, 'New title');
    assert.equal(result[0].createdAt, '2019-01-01T00:00:00.000Z');
    assert.notEqual(result[0].updatedAt, '2019-01-01T00:00:00.000Z');
  });

  test('updatePaper leaves other WorkProducts (including other kinds) untouched', () => {
    const paper: WorkProductPaper = { id: 'p1', kind: 'paper', createdAt: 'x', updatedAt: 'x', payload: { id: 'p1', title: 'A' } as any };
    const journey: WorkProductResearchJourney = { id: 'j1', kind: 'research_journey', createdAt: 'x', updatedAt: 'x', payload: { id: 'j1', title: 'J' } as any };
    const result = updatePaper([paper, journey], { id: 'p1', title: 'A updated' } as any);
    assert.equal(result.find((wp) => wp.id === 'j1'), journey);
  });

  test('deletePaper removes only the matching paper', () => {
    const paper: WorkProductPaper = { id: 'p1', kind: 'paper', createdAt: 'x', updatedAt: 'x', payload: { id: 'p1' } as any };
    const journey: WorkProductResearchJourney = { id: 'p1', kind: 'research_journey', createdAt: 'x', updatedAt: 'x', payload: { id: 'p1' } as any };
    // Deliberately same id, different kind, to prove the kind check matters.
    const result = deletePaper([paper, journey], 'p1');
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, 'research_journey');
  });

  test('selectPapers narrows correctly and returns payloads', () => {
    const items: WorkProduct[] = [
      { id: 'p1', kind: 'paper', createdAt: 'x', updatedAt: 'x', payload: { id: 'p1', title: 'A' } as any },
      { id: 'j1', kind: 'research_journey', createdAt: 'x', updatedAt: 'x', payload: { id: 'j1', title: 'J' } as any },
    ];
    const papers = selectPapers(items);
    assert.equal(papers.length, 1);
    assert.equal(papers[0].title, 'A');
  });
});

// ----------------- journeys -----------------

describe('journey mutations', () => {
  test('addJourney appends a new envelope', () => {
    const result = addJourney([], { id: 'j1', title: 'New journey' } as any);
    assert.equal(result.length, 1);
    assert.equal(result[0].kind, 'research_journey');
  });

  test('updateJourney preserves nested structures unchanged (passed through, not touched)', () => {
    const existing: WorkProductResearchJourney = {
      id: 'j1',
      kind: 'research_journey',
      createdAt: '2019-01-01T00:00:00.000Z',
      updatedAt: '2019-01-01T00:00:00.000Z',
      payload: { id: 'j1', title: 'Old', chapters: [{ id: 'ch1', title: 'C1' }] } as any,
    };
    const updated = { id: 'j1', title: 'New', chapters: [{ id: 'ch1', title: 'C1' }, { id: 'ch2', title: 'C2' }] } as any;
    const result = updateJourney([existing], updated);
    assert.deepEqual((result[0] as WorkProductResearchJourney).payload.chapters, updated.chapters);
    assert.equal(result[0].createdAt, '2019-01-01T00:00:00.000Z');
  });

  test('deleteJourney removes only the matching journey', () => {
    const j1: WorkProductResearchJourney = { id: 'j1', kind: 'research_journey', createdAt: 'x', updatedAt: 'x', payload: { id: 'j1' } as any };
    const j2: WorkProductResearchJourney = { id: 'j2', kind: 'research_journey', createdAt: 'x', updatedAt: 'x', payload: { id: 'j2' } as any };
    const result = deleteJourney([j1, j2], 'j1');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'j2');
  });

  test('selectJourneys narrows correctly', () => {
    const items: WorkProduct[] = [
      { id: 'p1', kind: 'paper', createdAt: 'x', updatedAt: 'x', payload: { id: 'p1' } as any },
      { id: 'j1', kind: 'research_journey', createdAt: 'x', updatedAt: 'x', payload: { id: 'j1', title: 'J' } as any },
    ];
    const journeys = selectJourneys(items);
    assert.equal(journeys.length, 1);
    assert.equal(journeys[0].title, 'J');
  });
});

// ----------------- publishing -----------------

describe('publishing field updates', () => {
  test('updatePublishingFields merges only the given fields, preserving the rest', () => {
    const draft = makePublishingDraft({ docTitle: 'Original', draftContent: 'Original body' });
    const result = updatePublishingFields([draft], { docTitle: 'Updated title' });
    const updated = result[0] as WorkProductPublishingDraft;
    assert.equal(updated.payload.docTitle, 'Updated title');
    assert.equal(updated.payload.draftContent, 'Original body');
  });

  test('updatePublishingFields does not touch paper/journey entries', () => {
    const paper: WorkProductPaper = { id: 'p1', kind: 'paper', createdAt: 'x', updatedAt: 'x', payload: { id: 'p1' } as any };
    const draft = makePublishingDraft();
    const result = updatePublishingFields([paper, draft], { docTitle: 'New' });
    assert.equal(result.find((wp) => wp.id === 'p1'), paper);
  });
});

describe('addPublishingNote', () => {
  test('prepends a well-formed NoteCard', () => {
    const draft = makePublishingDraft({ notes: [{ id: 'n0', title: 'Existing', content: 'c', tags: [], updatedAt: '2020-01-01' }] as any });
    const result = addPublishingNote([draft], { id: 'n1', title: 'New note', content: 'text', tags: [], updatedAt: '2026-01-01' } as any);
    const updated = result[0] as WorkProductPublishingDraft;
    assert.equal(updated.payload.notes.length, 2);
    assert.equal((updated.payload.notes[0] as any).id, 'n1');
    assert.equal((updated.payload.notes[1] as any).id, 'n0');
  });

  test('preserves a note that does not conform to NoteCard (category/createdAt shape from ResearchWellbeing) without modification', () => {
    const draft = makePublishingDraft();
    const wellbeingShapedNote = {
      id: 'note_intent_123',
      title: 'Session Intent (Aug 25)',
      content: 'Finish literature review section',
      category: 'todo',
      tags: ['Focus Intent', 'Session Goal'],
      createdAt: 'Aug 25, 2026',
    };
    const result = addPublishingNote([draft], wellbeingShapedNote);
    const updated = result[0] as WorkProductPublishingDraft;
    assert.deepEqual(updated.payload.notes[0], wellbeingShapedNote);
    // Confirm the discrepant fields specifically survived untouched -- this
    // is the regression coverage for the "still visible after cutover" fix.
    assert.equal((updated.payload.notes[0] as any).category, 'todo');
    assert.equal((updated.payload.notes[0] as any).createdAt, 'Aug 25, 2026');
    assert.equal((updated.payload.notes[0] as any).updatedAt, undefined);
  });

  test('a note added via addPublishingNote is visible through selectPublishingDraft (simulating both callers sharing one choke point)', () => {
    let items: WorkProduct[] = [makePublishingDraft()];
    // Simulate CreativePublishingWorkspace's own "add note" call.
    items = addPublishingNote(items, { id: 'from-workspace', title: 'W', content: 'c', tags: [], updatedAt: 'x' } as any);
    // Simulate ResearchWellbeing's "save session intent" call, in the
    // differently-shaped format it actually uses.
    items = addPublishingNote(items, { id: 'from-wellbeing', title: 'Session Intent', content: 'c', category: 'todo', tags: [], createdAt: 'x' });

    const draft = selectPublishingDraft(items);
    const ids = draft.notes.map((n: any) => n.id);
    assert.deepEqual(ids, ['from-wellbeing', 'from-workspace']);
  });
});

// ----------------- reset / restore -----------------

describe('resetWorkProductsToSeed', () => {
  test('rebuilds papers and journeys from seed, and publishing to documented empty defaults', () => {
    const result = resetWorkProductsToSeed(
      [{ id: 'seed-p1', title: 'Seed paper' } as any],
      [{ id: 'seed-j1', title: 'Seed journey' } as any]
    );
    assert.equal(selectPapers(result).length, 1);
    assert.equal(selectJourneys(result).length, 1);
    const publishing = selectPublishingDraft(result);
    assert.equal(publishing.docTitle, 'Untitled Scholarly Monograph');
    assert.deepEqual(publishing.notes, []);
  });
});

describe('restoreDemoPapersAndJourneys', () => {
  test('replaces papers/journeys but leaves the existing publishing_draft entry completely untouched', () => {
    const existingPublishing = makePublishingDraft({ docTitle: 'User is actively editing this', notes: [{ id: 'n1' } as any] });
    const current: WorkProduct[] = [
      { id: 'old-p', kind: 'paper', createdAt: 'x', updatedAt: 'x', payload: { id: 'old-p' } as any },
      existingPublishing,
    ];
    const result = restoreDemoPapersAndJourneys(current, [{ id: 'seed-p1', title: 'Seed' } as any], []);
    assert.equal(selectPapers(result).length, 1);
    assert.equal(selectPapers(result)[0].id, 'seed-p1');
    // Publishing must be the exact same object reference -- proving it was
    // genuinely not touched, not just equal by coincidence.
    assert.equal(result.find((wp) => wp.kind === 'publishing_draft'), existingPublishing);
  });
});

// ----------------- persistence adapter -----------------

describe('saveWorkProducts', () => {
  test('writes to the documented key and reports success', () => {
    const result = saveWorkProducts([makePublishingDraft()]);
    assert.equal(result.ok, true);
    assert.notEqual(localStorage.getItem('pessoa_work_products'), null);
  });

  test('reports failure without throwing when the underlying write fails', () => {
    const originalSetItem = (localStorage as any).setItem;
    (localStorage as any).setItem = () => {
      throw new Error('quota exceeded (simulated)');
    };
    const result = saveWorkProducts([makePublishingDraft()]);
    assert.equal(result.ok, false);
    assert.ok(result.error);
    (localStorage as any).setItem = originalSetItem;
  });
});
