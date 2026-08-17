/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserUploadedDoc, ArticleHighlight } from '../types/wellbeingInsights';

const USER_DOCS_KEY = 'second_thought_user_library_docs';
const BOOKMARKS_KEY = 'second_thought_article_bookmarks';
const HIGHLIGHTS_KEY = 'second_thought_article_highlights';

// Initial default user document sample for instant testability
const INITIAL_SAMPLE_DOC: UserUploadedDoc = {
  id: 'user-doc-sample-1',
  title: 'Personal Field Notes on Writing Routines & Focus',
  authors: 'User Upload (Personal Archival Copy)',
  year: 2025,
  filename: 'my_field_notes_focus_routines.pdf',
  fileType: 'pdf',
  fileSize: 1024 * 240, // 240 KB
  uploadedAt: new Date().toISOString(),
  tags: ['writing habits', 'field notes', 'imposter syndrome'],
  attachedInsightIds: ['imposter-syndrome', 'building-self-trust'],
  notes: 'My personal PDF notes collected from writing retreats and supervisor meetings.',
  textContent: `# Personal Field Notes on Writing Routines & Focus

## Observation 1: Micro-Sessions over Marathon Sprints
When attempting 6-hour marathon writing blocks, fatigue sets in after hour 2. Switching to 25-minute quiet writing intervals drastically reduces writing avoidance.

## Observation 2: Separating Editing from Generating
Drafting prose with active spellcheckers or citation generators triggers perfectionist anxiety. Disabling live formatting until the first 500 words are complete produces freer, more authentic thoughts.

## Observation 3: Peer Reflection
Discussing manuscript struggles with research peers normalizes rejections and peer review revisions. Rejections are evaluations of a text at a moment in time, not an assessment of personal intellect.`
};

export function getUserLibrary(): UserUploadedDoc[] {
  try {
    const raw = localStorage.getItem(USER_DOCS_KEY);
    if (!raw) {
      localStorage.setItem(USER_DOCS_KEY, JSON.stringify([INITIAL_SAMPLE_DOC]));
      return [INITIAL_SAMPLE_DOC];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading user library:', err);
    return [INITIAL_SAMPLE_DOC];
  }
}

export function saveUserDoc(doc: UserUploadedDoc): UserUploadedDoc[] {
  const docs = getUserLibrary();
  const existingIdx = docs.findIndex(d => d.id === doc.id);
  let updated: UserUploadedDoc[];
  if (existingIdx >= 0) {
    updated = [...docs];
    updated[existingIdx] = doc;
  } else {
    updated = [doc, ...docs];
  }
  localStorage.setItem(USER_DOCS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('user_library_updated'));
  return updated;
}

export function deleteUserDoc(id: string): UserUploadedDoc[] {
  const docs = getUserLibrary();
  const updated = docs.filter(d => d.id !== id);
  localStorage.setItem(USER_DOCS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('user_library_updated'));
  return updated;
}

export function updateDocMetadata(id: string, updates: Partial<UserUploadedDoc>): UserUploadedDoc[] {
  const docs = getUserLibrary();
  const updated = docs.map(d => (d.id === id ? { ...d, ...updates } : d));
  localStorage.setItem(USER_DOCS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('user_library_updated'));
  return updated;
}

export function attachDocToInsight(docId: string, insightId: string): UserUploadedDoc[] {
  const docs = getUserLibrary();
  const updated = docs.map(d => {
    if (d.id === docId) {
      const current = d.attachedInsightIds || [];
      if (!current.includes(insightId)) {
        return { ...d, attachedInsightIds: [...current, insightId] };
      }
    }
    return d;
  });
  localStorage.setItem(USER_DOCS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('user_library_updated'));
  return updated;
}

// ----------------- BOOKMARKS & HIGHLIGHTS -----------------
export function getArticleBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleArticleBookmark(articleId: string): boolean {
  const bookmarks = getArticleBookmarks();
  let updated: string[];
  let isBookmarked = false;
  if (bookmarks.includes(articleId)) {
    updated = bookmarks.filter(id => id !== articleId);
    isBookmarked = false;
  } else {
    updated = [...bookmarks, articleId];
    isBookmarked = true;
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('article_bookmarks_updated'));
  return isBookmarked;
}

export function getArticleHighlights(articleId: string): ArticleHighlight[] {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY);
    const all: ArticleHighlight[] = raw ? JSON.parse(raw) : [];
    return all.filter(h => h.articleId === articleId);
  } catch {
    return [];
  }
}

export function saveArticleHighlight(highlight: ArticleHighlight): ArticleHighlight[] {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY);
    const all: ArticleHighlight[] = raw ? JSON.parse(raw) : [];
    const updated = [highlight, ...all];
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('article_highlights_updated'));
    return updated.filter(h => h.articleId === highlight.articleId);
  } catch {
    return [highlight];
  }
}

export function deleteArticleHighlight(highlightId: string, articleId: string): ArticleHighlight[] {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY);
    const all: ArticleHighlight[] = raw ? JSON.parse(raw) : [];
    const updated = all.filter(h => h.id !== highlightId);
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('article_highlights_updated'));
    return updated.filter(h => h.articleId === articleId);
  } catch {
    return [];
  }
}
