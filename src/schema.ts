/**
 * Drizzle schema root — direct hand-authored barrel.
 *
 * (Previously re-exported a codegen-owned `./generated/schema.ts`; that
 * indirection was retired when qsp moved off the v1 codegen registry — entity
 * files now live in src/modules/<plural>/<entity>.entity.ts and are pulled in
 * directly here.)
 */
export * from './modules/accounts/account.entity';
export * from './modules/contacts/contact.entity';
export * from './modules/emails/email.entity';
export * from './modules/opportunities/opportunity.entity';
export * from './modules/transcripts/transcript.entity';

// EAV substrate (field_definitions + field_values) — hand-authored, lives
// outside the generated barrel. The FilterCompiler JOINs to these to resolve
// EAV field paths. See src/query/eav-schema.ts.
export * from './query/eav/schema';

// Observation variants — typed packets about a communication. Live outside the
// generated barrel (added introspection-first, not via codegen).
export * from './modules/transcript-observations/transcript-observation.entity';

// Runtime registry profile table — drives which entities are exposed (data, not code).
export { entityRegistrations } from './query/runtime-registry';
