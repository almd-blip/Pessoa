/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stage 2 -- WorkProduct schema.
 *
 * See docs/PRODUCT-CONTRACT.md ("Person -> Project -> Work Mode ->
 * Work Product -> Privacy State") and the approved Stage 2 Design Proposal
 * recorded in docs/DECISIONS.md.
 *
 * Architecture: hybrid envelope. A minimal identity/metadata envelope wraps
 * the existing, unmodified domain-specific payload types (Paper,
 * ResearchJourney, the publishing cluster). This deliberately does not
 * normalise or flatten those payloads -- see the Stage 2 design proposal's
 * comparison of envelope vs. normalised vs. hybrid approaches.
 *
 * Only three kinds exist, because only these three currently have real,
 * persisted, substantive data to migrate (see docs/DECISIONS.md, approved
 * decisions D1, D5, D6). This is deliberately not the full illustrative
 * list from docs/PRODUCT-CONTRACT.md -- speculative kinds are not added
 * merely because the Contract mentions them as examples.
 */

import { Paper, ResearchJourney } from '../types';
import {
  OutlineItem,
  NoteCard,
  PublisherChecklistItem,
  ImportedDocument,
} from '../components/CreativePublishingWorkspace';

export type WorkProductKind = 'paper' | 'research_journey' | 'publishing_draft';

/**
 * Provenance of AI processing that produced or contributed to a
 * WorkProduct, mirroring the `_processing` metadata the P0 shared AI task
 * layer already returns (see server.ts, runAiTask). This is not a general
 * "privacy state" mechanism -- it only records processing route/provider/
 * model already computed elsewhere; it does not invent new privacy
 * behaviour.
 */
export interface WorkProductPrivacyAnnotation {
  route: 'local-server' | 'local-browser' | 'cloud';
  provider: string;
  model: string;
}

interface WorkProductEnvelopeBase {
  /** Stable identity. For migrated records, this is the original record's
   * own id, preserved verbatim -- never regenerated. */
  id: string;
  /** ISO 8601. For records produced by the Stage 2 migration and not
   * previously migrated, this is the migration run's timestamp, not a true
   * historical creation time (docs/DECISIONS.md, approved decision D3).
   * Preserved unchanged across subsequent migration runs once first set. */
  createdAt: string;
  /** ISO 8601. Reflects the most recent migration/derivation pass for this
   * record (or a genuine edit time, once WorkProducts are ever written to
   * directly outside migration). */
  updatedAt: string;
  /** Deliberately optional and NOT populated by the Stage 2 migration.
   * Reserved as a schema-level placeholder only; project resolution is
   * Stage 3 work (docs/DECISIONS.md, approved decision D2). */
  projectId?: string;
  /** Deliberately optional. Only meaningful for WorkProducts that resulted
   * from an AI task; not populated for paper/research_journey/
   * publishing_draft, which have no AI-processing provenance of their own. */
  privacy?: WorkProductPrivacyAnnotation;
}

/**
 * The publishing workspace's eight legacy keys, combined into one typed
 * payload. There is exactly one publishing_draft WorkProduct (see
 * docs/DECISIONS.md, approved decision D6) -- Stage 2 does not implement
 * multi-document publishing.
 */
export interface PublishingDraftPayload {
  docTitle: string;
  draftContent: string;
  outline: OutlineItem[];
  notes: NoteCard[];
  checklist: PublisherChecklistItem[];
  importedDocs: ImportedDocument[];
  journalTargetId: string;
  customTargetWords?: number;
}

export interface WorkProductPaper extends WorkProductEnvelopeBase {
  kind: 'paper';
  payload: Paper;
}

export interface WorkProductResearchJourney extends WorkProductEnvelopeBase {
  kind: 'research_journey';
  payload: ResearchJourney;
}

export interface WorkProductPublishingDraft extends WorkProductEnvelopeBase {
  kind: 'publishing_draft';
  payload: PublishingDraftPayload;
}

export type WorkProduct =
  | WorkProductPaper
  | WorkProductResearchJourney
  | WorkProductPublishingDraft;
