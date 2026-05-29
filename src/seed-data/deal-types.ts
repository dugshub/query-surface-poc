// Shared types for per-deal seed files.
//
// Each `src/seed-data/deal-NN-<slug>.ts` file exports a `DealSeed` object;
// `src/seed.ts` aggregates all of them via the barrel `./index.ts` and inserts
// in dependency order (accounts → opportunities → contacts → emails → transcripts).
//
// Drizzle's inferred Insert types do the type-checking — every deal file gets
// red squigglies if it forgets a required column.

import type { AccountInsert } from '../modules/accounts/account.entity';
import type { OpportunityInsert } from '../modules/opportunities/opportunity.entity';
import type { ContactInsert } from '../modules/contacts/contact.entity';

// ---------------------------------------------------------------------------
// Authoring DTOs — the FLAT shape deal files write, decoupled from the Drizzle
// Insert types. `seed.ts` explodes each into the normalized graph:
//
//   EmailSeed      → communications(type=email) + emails + participants(from/to/cc)
//   TranscriptSeed → communications(type=meeting) + meetings + transcripts
//                    + participants(host/attendee/invitee)
//
// People + participants are DERIVED from the address strings here (fromAddress,
// toAddresses, creatorEmail, attendeeEmails), so deal files stay address-centric
// and never hand-write a participant row. See src/seed.ts (explodeDeals).
// ---------------------------------------------------------------------------

/** An email as authored in a deal file (flat). */
export interface EmailSeed {
  userId: string;
  opportunityId: string;
  /** Legacy loose hints — ignored by the seeder except as context. */
  accountId?: string;
  contactId?: string;
  externalId?: string;
  occurredAt: Date;
  subject?: string;
  bodyText?: string;
  fromAddress: string;
  toAddresses?: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  direction: 'inbound' | 'outbound';
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
  hasAttachments?: boolean;
}

export type InviteResponse = 'accepted' | 'declined' | 'tentative' | 'no_response';

/** A meeting invitee who may or may not have attended (invited ≠ attended). */
export interface InviteeSeed {
  email: string;
  name?: string;
  response?: InviteResponse;
  attended?: boolean;
}

/** A transcript (and its parent meeting) as authored in a deal file (flat). */
export interface TranscriptSeed {
  id?: string;
  userId: string;
  opportunityId: string;
  externalId?: string;
  externalLink?: string;
  occurredAt: Date;
  title: string;
  source?: 'zoom' | 'google_meet' | 'manual' | 'gong' | 'granola' | 'fathom';
  duration?: number;
  creatorName?: string;
  creatorEmail?: string;
  attendeeEmails?: string[];
  scope?: 'external' | 'internal' | 'unknown';
  language?: string;
  transcript?: string;
  summary?: string;
  userNotes?: string;
  enhancedNotes?: string;
  /** Meeting facets. Defaults: isScheduled = (source !== 'manual'). */
  isScheduled?: boolean;
  location?: string;
  /** Optional invitees beyond the attendee list — drives the invited≠attended demo. */
  invitees?: InviteeSeed[];
}

// EAV FLIP: opportunity's business fields are no longer table columns — they're
// EAV-backed. The deal files still author them inline on `opportunity` for
// ergonomics; `build-eav.ts` projects them into field_values and `seed.ts`
// strips them before inserting the (system-column-only) opportunity row. This
// type carries those field values alongside the real insert columns.
export interface OpportunityFieldValues {
  stage?: 'prospect' | 'qualifying' | 'presenting' | 'negotiation' | 'closing' | 'won' | 'lost' | null;
  amount?: number | null;       // cents (build-eav converts to dollars for the SF Amount field)
  closeDate?: Date | null;
  nextStep?: string | null;
  probability?: number | null;
  isClosed?: boolean | null;
  isWon?: boolean | null;
  description?: string | null;
}

/** Keys carried inline on the seed but projected to EAV (not opportunity columns). */
export const OPPORTUNITY_EAV_SEED_KEYS = [
  'stage', 'amount', 'closeDate', 'nextStep', 'probability', 'isClosed', 'isWon', 'description',
] as const;

export interface DealSeed {
  account: AccountInsert;
  opportunity: OpportunityInsert & OpportunityFieldValues;
  contacts: ContactInsert[];
  emails: EmailSeed[];
  transcripts: TranscriptSeed[];
}

// Single-tenant for the POC. Every row gets the same user_id.
export const USER_ID = '11111111-1111-1111-1111-111111111111';

// Helper for building realistic transcript bodies — concatenates speaker turns
// with the same SPEAKER: text\n\n shape across all deals so the compiler sees
// uniform formatting across the corpus.
export function transcriptBody(
  turns: Array<{ speaker: 'seller' | 'buyer' | 'unknown'; text: string }>,
): string {
  return turns.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n\n');
}
