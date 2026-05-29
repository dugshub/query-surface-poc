// Example seeds — loadable preset queries (the old demo's canned examples,
// reborn as Snapshots the builder restores). Great for onboarding + demoing.
import { newGroup, newLeaf, type FGroup, type FLeaf } from './filter';
import type { Op } from './types';
import type { Snapshot } from './url';

const leaf = (on: string, op: Op, value: unknown): FLeaf => ({ ...newLeaf(on, op), value });
const group = (children: FLeaf[]): FGroup => ({ ...newGroup('and'), children });
const snap = (entity: string, children: FLeaf[], columns: string[] = []): Snapshot =>
  ({ entity, tree: group(children), columns, sort: [], limit: 25, offset: 0 });

export interface Seed { label: string; hint: string; snap: Snapshot; }

export const SEEDS: Seed[] = [
  {
    label: 'EAV: stage + amount',
    hint: 'opportunities — StageName in [...] AND Amount > 100000 (EAV fields, native-feeling)',
    snap: snap('opportunities', [
      leaf('StageName', 'in', ['Negotiation/Review', 'Proposal/Price Quote']),
      leaf('Amount', 'gt', 100000),
    ], ['name', 'StageName', 'Amount']),
  },
  {
    label: 'Text: "pricing"',
    hint: 'transcripts — text fan-out across searchable columns → snippet highlights',
    snap: snap('transcripts', [leaf('text', 'contains', 'pricing')]),
  },
  {
    label: 'Cross-entity: "security"',
    hint: 'opportunities where any transcript mentions "security" (compiles to EXISTS)',
    snap: snap('opportunities', [leaf('transcripts.transcript', 'contains', 'security')], ['name', 'StageName']),
  },
  {
    label: 'Two-hop: Acme emails',
    hint: 'emails → opportunity → account.name = "Acme Corp" (two-hop belongs_to)',
    snap: snap('emails', [leaf('opportunity.account.name', 'eq', 'Acme Corp')]),
  },
  {
    label: 'Competitor: "Looker"',
    hint: 'opportunities where a transcript mentions "Looker"',
    snap: snap('opportunities', [leaf('transcripts.transcript', 'contains', 'Looker')], ['name']),
  },
];
