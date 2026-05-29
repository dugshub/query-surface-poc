// Demo seed — loads all per-deal files from src/seed-data/ and inserts in
// dependency order. Deal files author a FLAT shape (emails + transcripts with
// address strings); this script EXPLODES that into the normalized graph:
//
//   people            — one per unique email across contacts + every address
//   contacts          — linked to their person (contact.person_id)
//   communications    — base row per email / per meeting (carries opportunity + occurredAt)
//     emails          — child (type=email)
//     meetings        — child (type=meeting); a transcript's parent
//       transcripts   — recorded artifact of a meeting
//   communication_participants — people↔communication edges (from/to/cc, host/attendee/invitee)
//
// Participants + people are DERIVED from the address strings in the DTOs, so
// deal files never hand-write a participant row.

import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db, closeDb } from './db';
import { accounts } from './modules/accounts/account.entity';
import { people, type PersonInsert } from './modules/people/person.entity';
import { opportunities } from './modules/opportunities/opportunity.entity';
import { contacts } from './modules/contacts/contact.entity';
import { communications, type CommunicationInsert } from './modules/communications/communication.entity';
import { emails, type EmailInsert } from './modules/emails/email.entity';
import { meetings, type MeetingInsert } from './modules/meetings/meeting.entity';
import { transcripts, type TranscriptInsert } from './modules/transcripts/transcript.entity';
import { communicationParticipants, type CommunicationParticipantInsert } from './modules/communications/communication-participant.entity';
import { fieldDefinitions, fieldValues, fieldValuesJsonb } from './query/eav/schema';
import { ALL_DEALS } from './seed-data';
import { USER_ID, OPPORTUNITY_EAV_SEED_KEYS, type DealSeed, type EmailSeed, type TranscriptSeed } from './seed-data/deal-types';
import { buildEavSeed } from './seed-data/build-eav';

// Our side. Any address on these domains is an internal person (the rep/org);
// everyone else is external (the customer side).
const OUR_DOMAINS = ['findtempo.co'];

const norm = (email: string): string => email.trim().toLowerCase();
const isInternal = (email: string): boolean => OUR_DOMAINS.some(d => norm(email).endsWith(`@${d}`));

function titleCaseLocalPart(email: string): string {
  const local = norm(email).split('@')[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(w => w[0]!.toUpperCase() + w.slice(1))
    .join(' ') || email;
}

// ---------------------------------------------------------------------------
// People registry — one canonical person per unique email. Name hints come from
// contacts first (real "First Last"), then any creator/invitee name provided.
// ---------------------------------------------------------------------------
interface PeopleRegistry {
  rows: PersonInsert[];
  idByEmail: Map<string, string>;
}

function buildPeople(deals: readonly DealSeed[]): PeopleRegistry {
  const idByEmail = new Map<string, string>();
  const nameByEmail = new Map<string, string>();

  const noteName = (email: string | undefined | null, name: string | undefined) => {
    if (!email || !name || !name.trim()) return;
    const k = norm(email);
    if (!nameByEmail.has(k)) nameByEmail.set(k, name.trim());
  };
  const register = (email: string | undefined | null) => {
    if (!email) return;
    const k = norm(email);
    if (!idByEmail.has(k)) idByEmail.set(k, randomUUID());
  };

  // Pass 1: name hints + registration from contacts (best display names).
  for (const d of deals) {
    for (const c of d.contacts) {
      noteName(c.email, [c.firstName, c.lastName].filter(Boolean).join(' '));
      register(c.email);
    }
  }
  // Pass 2: every address that appears anywhere.
  for (const d of deals) {
    for (const e of d.emails) {
      register(e.fromAddress);
      (e.toAddresses ?? []).forEach(register);
      (e.ccAddresses ?? []).forEach(register);
      (e.bccAddresses ?? []).forEach(register);
    }
    for (const t of d.transcripts) {
      noteName(t.creatorEmail, t.creatorName);
      register(t.creatorEmail);
      (t.attendeeEmails ?? []).forEach(register);
      for (const inv of t.invitees ?? []) {
        noteName(inv.email, inv.name);
        register(inv.email);
      }
    }
  }

  const rows: PersonInsert[] = [];
  for (const [email, id] of idByEmail) {
    rows.push({
      id,
      userId: USER_ID,
      email,
      displayName: nameByEmail.get(email) ?? titleCaseLocalPart(email),
      kind: isInternal(email) ? 'internal' : 'external',
    });
  }
  return { rows, idByEmail };
}

// ---------------------------------------------------------------------------
// Explode the flat DTOs into the normalized graph.
// ---------------------------------------------------------------------------
interface Exploded {
  communications: CommunicationInsert[];
  emails: EmailInsert[];
  meetings: MeetingInsert[];
  transcripts: TranscriptInsert[];
  participants: CommunicationParticipantInsert[];
}

function explodeDeals(deals: readonly DealSeed[], reg: PeopleRegistry): Exploded {
  const out: Exploded = { communications: [], emails: [], meetings: [], transcripts: [], participants: [] };
  const personId = (email: string): string => {
    const id = reg.idByEmail.get(norm(email));
    if (!id) throw new Error(`seed: no person registered for ${email}`);
    return id;
  };
  for (const d of deals) {
    for (const e of d.emails) explodeEmail(e, out, personId);
    for (const t of d.transcripts) explodeTranscript(t, out, personId);
  }
  return out;
}

function explodeEmail(e: EmailSeed, out: Exploded, personId: (email: string) => string): void {
  const commId = randomUUID();
  out.communications.push({
    id: commId, userId: e.userId, opportunityId: e.opportunityId,
    type: 'email', occurredAt: e.occurredAt, externalId: e.externalId,
  });
  out.emails.push({
    id: randomUUID(), communicationId: commId,
    subject: e.subject, bodyText: e.bodyText, direction: e.direction,
    threadId: e.threadId, messageId: e.messageId, inReplyTo: e.inReplyTo,
    hasAttachments: e.hasAttachments ?? false,
  });
  const seen = new Set<string>();
  const add = (email: string, role: CommunicationParticipantInsert['role']) => {
    const pid = personId(email);
    const key = `${pid}:${role}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.participants.push({ communicationId: commId, personId: pid, role });
  };
  add(e.fromAddress, 'from');
  (e.toAddresses ?? []).forEach(a => add(a, 'to'));
  (e.ccAddresses ?? []).forEach(a => add(a, 'cc'));
  (e.bccAddresses ?? []).forEach(a => add(a, 'bcc'));
}

function explodeTranscript(t: TranscriptSeed, out: Exploded, personId: (email: string) => string): void {
  const commId = randomUUID();
  out.communications.push({
    id: commId, userId: t.userId, opportunityId: t.opportunityId,
    type: 'meeting', occurredAt: t.occurredAt, externalId: t.externalId,
  });
  const meetingId = randomUUID();
  out.meetings.push({
    id: meetingId, communicationId: commId,
    title: t.title, source: t.source, scope: t.scope,
    isScheduled: t.isScheduled ?? (t.source !== 'manual'),
    location: t.location, durationSeconds: t.duration,
  });
  out.transcripts.push({
    id: t.id ?? randomUUID(), meetingId,
    transcript: t.transcript, summary: t.summary,
    userNotes: t.userNotes, enhancedNotes: t.enhancedNotes,
    language: t.language, externalLink: t.externalLink,
  });

  // Participants: host (creator) + attendees + invitees. invited ≠ attended —
  // an invitee may not have attended (response/attended set independently), and
  // an attendee may have no invitee row (showed up without an invite).
  const byPersonRole = new Set<string>();
  const add = (
    email: string,
    role: CommunicationParticipantInsert['role'],
    response: CommunicationParticipantInsert['response'],
    attended: boolean,
  ) => {
    const pid = personId(email);
    const key = `${pid}:${role}`;
    if (byPersonRole.has(key)) return;
    byPersonRole.add(key);
    out.participants.push({ communicationId: commId, personId: pid, role, response, attended });
  };

  const creator = t.creatorEmail ? norm(t.creatorEmail) : null;
  if (t.creatorEmail) add(t.creatorEmail, 'host', 'accepted', true);
  for (const a of t.attendeeEmails ?? []) {
    if (creator && norm(a) === creator) continue; // host already covers the creator
    add(a, 'attendee', 'accepted', true);
  }
  for (const inv of t.invitees ?? []) {
    add(inv.email, 'invitee', inv.response ?? 'no_response', inv.attended ?? false);
    if (inv.attended) add(inv.email, 'attendee', inv.response ?? 'accepted', true);
  }
}

// Strip inline EAV field values (stage/amount/…) so only real opportunity
// columns are inserted; their values are seeded into field_values by buildEavSeed.
function toOpportunityRow(o: object): Record<string, unknown> {
  const row = { ...o } as Record<string, unknown>;
  for (const k of OPPORTUNITY_EAV_SEED_KEYS) delete row[k];
  return row;
}

async function main(): Promise<void> {
  console.log(`Loading ${ALL_DEALS.length} deals from src/seed-data/…`);

  const peopleReg = buildPeople(ALL_DEALS);

  const allAccounts      = ALL_DEALS.map(d => d.account);
  const allOpportunities = ALL_DEALS.map(d => toOpportunityRow(d.opportunity));
  // Link each contact to its canonical person by email.
  const allContacts      = ALL_DEALS.flatMap(d => d.contacts).map(c => ({
    ...c,
    personId: c.email ? peopleReg.idByEmail.get(norm(c.email)) ?? null : null,
  }));
  const g = explodeDeals(ALL_DEALS, peopleReg);

  const { fieldDefinitions: defRows, fieldValues: valueRows, fieldValuesJsonb: jsonbRows } = buildEavSeed(ALL_DEALS, USER_ID);

  console.log('Truncating tables…');
  await db.execute(sql`TRUNCATE TABLE field_values_jsonb, field_values, field_definitions, communication_participants, transcripts, meetings, emails, communications, contacts, opportunities, people, accounts RESTART IDENTITY CASCADE`);

  console.log(`Seeding ${peopleReg.rows.length} people…`);
  await db.insert(people).values(peopleReg.rows);

  console.log(`Seeding ${allAccounts.length} accounts…`);
  await db.insert(accounts).values(allAccounts);

  // Demo self-join: a parent-company hierarchy (subsidiaries → parent account).
  await db.execute(sql`
    UPDATE accounts c SET parent_account_id = p.id
      FROM accounts p
      WHERE p.external_id = 'sf-acct-006' AND c.external_id IN ('sf-acct-007', 'sf-acct-008')`);

  console.log(`Seeding ${allOpportunities.length} opportunities…`);
  await db.insert(opportunities).values(allOpportunities as (typeof opportunities.$inferInsert)[]);

  console.log(`Seeding ${allContacts.length} contacts…`);
  await db.insert(contacts).values(allContacts);

  console.log(`Seeding ${g.communications.length} communications…`);
  await db.insert(communications).values(g.communications);
  console.log(`Seeding ${g.emails.length} emails + ${g.meetings.length} meetings…`);
  await db.insert(emails).values(g.emails);
  await db.insert(meetings).values(g.meetings);
  console.log(`Seeding ${g.transcripts.length} transcripts…`);
  await db.insert(transcripts).values(g.transcripts);
  console.log(`Seeding ${g.participants.length} communication_participants…`);
  await db.insert(communicationParticipants).values(g.participants);

  // EAV: field_definitions then field_values (typed cells projected per opportunity).
  console.log(`Seeding ${defRows.length} field_definitions…`);
  await db.insert(fieldDefinitions).values(defRows);
  console.log(`Seeding ${valueRows.length} field_values (Shape A, opportunity)…`);
  await db.insert(fieldValues).values(valueRows);
  console.log(`Seeding ${jsonbRows.length} field_values_jsonb (Shape B, account)…`);
  await db.insert(fieldValuesJsonb).values(jsonbRows);

  console.log('');
  console.log('Done. Per-deal breakdown:');
  for (const d of ALL_DEALS) {
    console.log(
      `  ${d.account.name.padEnd(28)}  ` +
      `${(d.opportunity.stage ?? '?').padEnd(12)}  ` +
      `$${((d.opportunity.amount ?? 0) / 100).toLocaleString().padStart(9)}  ` +
      `(${d.contacts.length} contacts, ${d.emails.length} emails, ${d.transcripts.length} meetings)`,
    );
  }
  console.log('');
  console.log(
    `Totals: ${peopleReg.rows.length} people / ${allAccounts.length} accounts / ${allOpportunities.length} opportunities / ` +
    `${allContacts.length} contacts / ${g.communications.length} communications ` +
    `(${g.emails.length} emails, ${g.meetings.length} meetings) / ${g.transcripts.length} transcripts / ` +
    `${g.participants.length} participants`,
  );
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => closeDb());
