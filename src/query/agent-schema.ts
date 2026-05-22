// Agent-facing schema descriptors — what `query_describe` exposes.
//
// Kept separate from src/generated/query-registry.ts (the COMPILER's metadata):
//   - registry: relationships + searchable columns the COMPILER needs to build SQL
//   - this file: column types, enum values, narrative summaries, example filters
//     the AGENT needs to compose queries correctly
//
// Hand-curated for the POC. In production, the column type/enum data is
// derivable from Drizzle introspection + pgEnum values; the narrative bits
// (summary, column notes, examples) stay hand-authored — they're domain
// guidance, not schema mechanics.

import type { EntityName } from './types';

// ---------------------------------------------------------------------------
// Shared vocabulary — same preamble whether the agent asks for one entity
// or the full schema. Anchors the filter language so the agent doesn't have
// to re-derive it from the tool descriptions.
// ---------------------------------------------------------------------------

export const VOCABULARY = {
  ops: {
    equality: ['eq', 'neq'],
    membership: ['in', 'nin'],
    numeric: ['gt', 'gte', 'lt', 'lte', 'between'],
    text: ['contains', 'startswith', 'endswith'],
    null: ['is_null', 'is_not_null'],
  },
  composites: ['and', 'or', 'not'],
  filterShape:
    'A LeafFilter is { on: <field>, op: <op>, value: <value> }. Composites: { and: [...] } | { or: [...] } | { not: ... }. Recursively composable.',
  dottedPaths:
    'Cross-entity reach: { on: "account.name", op: "eq", value: "Acme" } resolves through belongs_to (LEFT JOIN) or has_many (EXISTS subquery) relationships.',
  textMagic:
    'Use { on: "text", op: "contains", value: "..." } to OR-fan-out across the entity\'s searchable columns (listed per-entity below). Saves you from having to know which columns to OR yourself.',
  sortShape: 'sort: [{ field: "<column>", dir: "asc" | "desc" }]',
  pagination: 'page: { limit?: number (1-1000, default 25), offset?: number }',
  tenantScope:
    'All queries are implicitly scoped to the current user. Do NOT filter by user_id yourself.',
  previewShape:
    'preview: true returns per-entity curated identifier columns (id + title/name/stage/occurred_at/opportunity_id-style columns — see each entity\'s descriptor) plus a _snippets[] array when text ops fire. Each snippet carries: column, snippet (windowed text with ellipses), match {start, end} offsets within the snippet, and full_length of the source column. The full body of long-text matched columns (transcript.transcript, email.body_text, etc.) is NOT included in preview rows — the snippet has the match window, which is sufficient for relevance assessment and quoting. If you need to read the full body, call query_fetch with the row id.',
  twoStagePattern:
    'Search → triage. Fetch → read. Use query_search (with preview: true) to find IDs and decide which rows matter using snippets + curated columns. Then use query_fetch on a narrowed ID set to hydrate full rows (with optional expand for related entities). Do not try to use preview as a substitute for fetch — long-text bodies are absent by design.',
} as const;

// ---------------------------------------------------------------------------
// Per-entity descriptor shape
// ---------------------------------------------------------------------------

type ColumnType = 'uuid' | 'string' | 'integer' | 'datetime' | 'boolean' | 'json' | 'enum';

interface ColumnDescriptor {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  enumValues?: readonly string[];
  notes?: string;
}

interface RelationshipDescriptor {
  name: string;
  kind: 'belongs_to' | 'has_many';
  target: EntityName;
  usage: string;
}

interface ExampleFilter {
  description: string;
  filter: Record<string, unknown>;
}

interface EntitySchema {
  name: EntityName;
  summary: string;
  columns: ColumnDescriptor[];
  relationships: RelationshipDescriptor[];
  searchableColumns: string[];
  searchableColumnsNote?: string;
  examples: ExampleFilter[];
}

// ---------------------------------------------------------------------------
// Per-entity schemas
// ---------------------------------------------------------------------------

const ACCOUNT: EntitySchema = {
  name: 'account',
  summary:
    'A company/organization the user sells to. Root of the CRM graph — opportunities and contacts hang off accounts.',
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'name', type: 'string', notes: 'Company name, e.g. "Acme Corp".' },
    { name: 'website', type: 'string', nullable: true },
    { name: 'external_id', type: 'string', nullable: true, notes: 'Salesforce/HubSpot ID.' },
    { name: 'organization_id', type: 'uuid', nullable: true },
    { name: 'provider_metadata', type: 'json', nullable: true, notes: 'Raw provider data — industry, employee_count, etc. live here as JSONB keys.' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
  ],
  relationships: [
    { name: 'opportunities', kind: 'has_many', target: 'opportunity', usage: 'Filter accounts by deal attributes: { on: "opportunities.stage", op: "eq", value: "closing" } → accounts with at least one closing deal.' },
    { name: 'contacts', kind: 'has_many', target: 'contact', usage: 'Filter accounts by contact attributes via has_many EXISTS subquery.' },
  ],
  searchableColumns: ['name', 'website'],
  examples: [
    { description: 'Find accounts by name', filter: { on: 'name', op: 'contains', value: 'Acme' } },
    { description: 'Find accounts with at least one closing-stage deal', filter: { on: 'opportunities.stage', op: 'eq', value: 'closing' } },
  ],
};

const OPPORTUNITY: EntitySchema = {
  name: 'opportunity',
  summary:
    'A sales deal/opportunity attached to an account. The central pipeline record — stage, amount, close date, narrative state.',
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'name', type: 'string', notes: 'Deal name, e.g. "Acme — Q3 New Logo".' },
    { name: 'account_id', type: 'uuid', notes: 'FK to account.' },
    { name: 'description', type: 'string', nullable: true, notes: 'Free-text deal description.' },
    {
      name: 'stage',
      type: 'enum',
      nullable: true,
      enumValues: ['prospect', 'qualifying', 'presenting', 'negotiation', 'closing', 'won', 'lost'],
      notes: 'Pipeline stage. Use these EXACT lowercase values for filtering.',
    },
    { name: 'amount', type: 'integer', nullable: true, notes: 'Deal amount in CENTS — $250,000 is stored as 25000000.' },
    { name: 'close_date', type: 'datetime', nullable: true, notes: 'Expected (or actual) close date.' },
    { name: 'next_step', type: 'string', nullable: true, notes: 'Free-text current next action. Searchable.' },
    { name: 'probability', type: 'integer', nullable: true, notes: '0-100 percent likelihood.' },
    { name: 'is_closed', type: 'boolean', notes: 'true if stage is won or lost.' },
    { name: 'is_won', type: 'boolean', notes: 'true ONLY if stage is won.' },
    { name: 'state_of_deal_status', type: 'string', nullable: true, notes: 'Short status label. Conventional values: "healthy", "at_risk", "closing", "lost". Varchar — not strictly enforced.' },
    { name: 'state_of_deal', type: 'string', nullable: true, notes: 'LLM-generated narrative summary of where the deal stands. Searchable.' },
    { name: 'is_visible', type: 'boolean' },
    { name: 'email_domains', type: 'json', nullable: true, notes: 'Array of domains associated with the deal.' },
    { name: 'external_id', type: 'string', nullable: true },
    { name: 'organization_id', type: 'uuid', nullable: true },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
  ],
  relationships: [
    { name: 'account', kind: 'belongs_to', target: 'account', usage: 'Reach via dotted path: { on: "account.name", op: "eq", value: "Acme Corp" }.' },
    { name: 'emails', kind: 'has_many', target: 'email', usage: 'Find opportunities by email contents: { on: "emails.subject", op: "contains", value: "pricing" }.' },
    { name: 'transcripts', kind: 'has_many', target: 'transcript', usage: 'Find opportunities by transcript contents: { on: "transcripts.transcript", op: "contains", value: "renewal" }.' },
  ],
  searchableColumns: ['name', 'description', 'state_of_deal', 'next_step'],
  searchableColumnsNote: 'Text-magic fan-out (`on: "text"`) ORs across these 4 columns.',
  examples: [
    { description: 'Deals currently in closing stage', filter: { on: 'stage', op: 'eq', value: 'closing' } },
    { description: 'Closing or negotiation deals over $100K', filter: { and: [{ on: 'stage', op: 'in', value: ['closing', 'negotiation'] }, { on: 'amount', op: 'gt', value: 10000000 }] } },
    { description: 'Deals at Acme Corp', filter: { on: 'account.name', op: 'eq', value: 'Acme Corp' } },
    { description: 'Text-magic search across all searchable columns', filter: { on: 'text', op: 'contains', value: 'compliance' } },
    { description: 'Deals where ANY transcript mentions pricing', filter: { on: 'transcripts.transcript', op: 'contains', value: 'pricing' } },
  ],
};

const CONTACT: EntitySchema = {
  name: 'contact',
  summary:
    'A person attached to an account — the human stakeholders on a deal. Buyers, champions, decision-makers.',
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'account_id', type: 'uuid', nullable: true, notes: 'FK to account.' },
    { name: 'first_name', type: 'string', nullable: true },
    { name: 'last_name', type: 'string', nullable: true },
    { name: 'email', type: 'string', nullable: true },
    { name: 'external_id', type: 'string', nullable: true },
    { name: 'organization_id', type: 'uuid', nullable: true },
    { name: 'provider_metadata', type: 'json', nullable: true },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
  ],
  relationships: [
    { name: 'account', kind: 'belongs_to', target: 'account', usage: 'Reach via dotted path: { on: "account.name", op: "eq", value: "Acme Corp" }.' },
  ],
  searchableColumns: ['first_name', 'last_name', 'email'],
  examples: [
    { description: 'Find contacts by email domain', filter: { on: 'email', op: 'endswith', value: '@acme.example' } },
    { description: 'Find contacts at Acme', filter: { on: 'account.name', op: 'eq', value: 'Acme Corp' } },
  ],
};

const EMAIL: EntitySchema = {
  name: 'email',
  summary:
    'A single email message tied to an opportunity. Captures inbound/outbound communication — subject, body, addresses, thread.',
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'opportunity_id', type: 'uuid', nullable: true, notes: 'FK to opportunity.' },
    { name: 'account_id', type: 'uuid', nullable: true, notes: 'Loose UUID — NOT a FK relationship (mirrors dealbrain prod).' },
    { name: 'contact_id', type: 'uuid', nullable: true, notes: 'Loose UUID — NOT a FK relationship.' },
    { name: 'occurred_at', type: 'datetime', notes: 'When the email was sent/received.' },
    { name: 'subject', type: 'string', nullable: true },
    { name: 'body_text', type: 'string', nullable: true, notes: 'Plain-text body. Searchable.' },
    { name: 'from_address', type: 'string', notes: 'Sender email.' },
    { name: 'to_addresses', type: 'json', nullable: true, notes: 'Array of recipient emails.' },
    { name: 'cc_addresses', type: 'json', nullable: true },
    {
      name: 'direction',
      type: 'enum',
      enumValues: ['inbound', 'outbound'],
      notes: 'inbound = customer → us; outbound = us → customer.',
    },
    { name: 'thread_id', type: 'string', nullable: true, notes: 'Groups emails in the same conversation.' },
    { name: 'message_id', type: 'string', nullable: true },
    { name: 'in_reply_to', type: 'string', nullable: true },
    { name: 'has_attachments', type: 'boolean' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
  ],
  relationships: [
    { name: 'opportunity', kind: 'belongs_to', target: 'opportunity', usage: 'Reach via dotted path: { on: "opportunity.stage", op: "eq", value: "closing" }. Two-hop also works: { on: "opportunity.account.name", op: "eq", value: "Acme Corp" }.' },
  ],
  searchableColumns: ['subject', 'body_text'],
  examples: [
    { description: 'Emails mentioning "pricing" in subject or body', filter: { on: 'text', op: 'contains', value: 'pricing' } },
    { description: 'Inbound emails on closing-stage deals', filter: { and: [{ on: 'direction', op: 'eq', value: 'inbound' }, { on: 'opportunity.stage', op: 'eq', value: 'closing' }] } },
    { description: 'Emails from CFO at Acme', filter: { and: [{ on: 'from_address', op: 'eq', value: 'cfo@acme.example' }, { on: 'opportunity.account.name', op: 'eq', value: 'Acme Corp' }] } },
  ],
};

const TRANSCRIPT: EntitySchema = {
  name: 'transcript',
  summary:
    'A call/meeting transcript tied to an opportunity. Full body text inline, plus LLM-generated summary and notes.',
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'opportunity_id', type: 'uuid', nullable: true, notes: 'FK to opportunity.' },
    { name: 'occurred_at', type: 'datetime', notes: 'When the call happened.' },
    { name: 'title', type: 'string', notes: 'Call title, e.g. "Acme — Pricing review". Searchable.' },
    {
      name: 'source',
      type: 'enum',
      enumValues: ['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom'],
      notes: 'Recording provider.',
    },
    { name: 'transcript', type: 'string', nullable: true, notes: 'Full transcript body (concatenated speaker turns). Searchable — this is the primary text-search target for "what was said on calls" questions.' },
    { name: 'summary', type: 'string', nullable: true, notes: 'LLM-generated call summary. Searchable.' },
    { name: 'user_notes', type: 'string', nullable: true, notes: 'Rep-authored notes. Searchable.' },
    { name: 'enhanced_notes', type: 'string', nullable: true, notes: 'LLM-augmented notes. Searchable.' },
    { name: 'duration', type: 'integer', nullable: true, notes: 'Call duration in seconds.' },
    { name: 'creator_name', type: 'string', nullable: true },
    { name: 'creator_email', type: 'string', nullable: true },
    { name: 'attendee_emails', type: 'json', nullable: true, notes: 'Array of attendee emails.' },
    {
      name: 'scope',
      type: 'enum',
      nullable: true,
      enumValues: ['external', 'internal', 'unknown'],
      notes: 'external = mixed internal/external parties; internal = all internal.',
    },
    { name: 'language', type: 'string', nullable: true, notes: 'ISO 639 code, e.g. "eng".' },
    { name: 'external_id', type: 'string', nullable: true },
    { name: 'external_link', type: 'string', nullable: true },
    { name: 'raw_data', type: 'json', nullable: true },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
  ],
  relationships: [
    { name: 'opportunity', kind: 'belongs_to', target: 'opportunity', usage: 'Reach via dotted path: { on: "opportunity.account.name", op: "eq", value: "Acme Corp" }.' },
  ],
  searchableColumns: ['title', 'transcript', 'summary', 'user_notes', 'enhanced_notes'],
  searchableColumnsNote:
    'Text-magic fan-out (`on: "text"`) ORs across these 5 columns. Broadest search surface in the schema — use it when you don\'t know whether a topic was discussed in the call body, the summary, or the rep\'s notes.',
  examples: [
    { description: 'Transcripts mentioning "pricing" anywhere (body / summary / notes)', filter: { on: 'text', op: 'contains', value: 'pricing' } },
    { description: 'Just the transcript body — exclude summary/notes', filter: { on: 'transcript', op: 'contains', value: 'data residency' } },
    { description: 'Pricing came up in transcripts at closing-stage deals', filter: { and: [{ on: 'transcript', op: 'contains', value: 'pricing' }, { on: 'opportunity.stage', op: 'eq', value: 'closing' }] } },
    { description: 'Two-hop: transcripts on Acme deals', filter: { on: 'opportunity.account.name', op: 'eq', value: 'Acme Corp' } },
  ],
};

// ---------------------------------------------------------------------------
// Index + lookups
// ---------------------------------------------------------------------------

const SCHEMAS: Record<EntityName, EntitySchema> = {
  account: ACCOUNT,
  opportunity: OPPORTUNITY,
  contact: CONTACT,
  email: EMAIL,
  transcript: TRANSCRIPT,
};

const ENTITY_GRAPH = [
  'account ── has_many ──> opportunity, contact',
  'opportunity ── belongs_to ──> account',
  'opportunity ── has_many ──> email, transcript',
  'contact ── belongs_to ──> account',
  'email ── belongs_to ──> opportunity',
  'transcript ── belongs_to ──> opportunity',
];

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/** Full schema for all entities, with shared vocabulary preamble. */
export function getFullSchema() {
  return {
    vocabulary: VOCABULARY,
    entity_graph: ENTITY_GRAPH,
    entities: Object.values(SCHEMAS),
  };
}

/** One entity's schema, with the shared vocabulary preamble. */
export function getEntitySchema(entity: EntityName) {
  return {
    vocabulary: VOCABULARY,
    entity_graph: ENTITY_GRAPH,
    entity: SCHEMAS[entity],
  };
}

/** Lightweight overview — entity names + one-line summaries only. */
export function getEntitySummaries() {
  return Object.values(SCHEMAS).map(s => ({ name: s.name, summary: s.summary }));
}
