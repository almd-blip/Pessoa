/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ResearchType = 'systematic review' | 'empirical study' | 'qualitative research' | 'theoretical paper';

export type AvailabilityStatus = 'Available Offline' | 'External Source' | 'User Uploaded';

export interface EmbeddedArticle {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  licence: string;
  source: string;
  localFile?: string;
  abstract: string;
  keywords: string[];
  fullText: string;
  researchType: ResearchType;
  category: 'academic' | 'creative';
}

export interface AdditionalSource {
  id: string;
  title: string;
  authors: string;
  year: number;
  publication: string;
  doi: string;
  publisherUrl?: string;
  researchRelevance: string;
  licenceStatus: string;
  researchType: ResearchType;
  category: 'academic' | 'creative';
}

export interface UserUploadedDoc {
  id: string;
  title: string;
  authors: string;
  year: number;
  filename: string;
  fileType: 'pdf' | 'epub' | 'txt' | 'html';
  fileSize: number; // in bytes
  uploadedAt: string;
  tags: string[];
  attachedInsightIds: string[];
  textContent: string; // extracted text for offline reading & searching
  notes?: string;
}

export interface ResearchWellbeingInsight {
  id: string;
  title: string;
  readingTime: string;
  researchQuestion: string;
  summary: string; // Plain-English summary with Harvard citations
  category: string;
  embeddedArticles: EmbeddedArticle[];
  additionalSources: AdditionalSource[];
}

export interface ArticleHighlight {
  id: string;
  articleId: string;
  text: string;
  note?: string;
  createdAt: string;
  color?: string;
}
