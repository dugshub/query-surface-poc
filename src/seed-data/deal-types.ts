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
import type { EmailInsert } from '../modules/emails/email.entity';
import type { TranscriptInsert } from '../modules/transcripts/transcript.entity';

export interface DealSeed {
  account: AccountInsert;
  opportunity: OpportunityInsert;
  contacts: ContactInsert[];
  emails: EmailInsert[];
  transcripts: TranscriptInsert[];
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
