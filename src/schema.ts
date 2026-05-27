/**
 * Drizzle schema root.
 * Re-exports the generated schema barrel. Codegen owns src/generated/schema.ts
 * — add or remove entity YAML to change the table set.
 */
export * from './generated/schema';

// EAV substrate (field_definitions + field_values) — hand-authored, lives
// outside the generated barrel. The FilterCompiler JOINs to these to resolve
// EAV field paths. See src/query/eav-schema.ts.
export * from './query/eav/schema';

// Observation variants — typed packets about a communication. Live outside the
// generated barrel (added introspection-first, not via codegen).
export * from './modules/transcript-observations/transcript-observation.entity';

// Runtime registry profile table — drives which entities are exposed (data, not code).
export { entityRegistrations } from './query/runtime-registry';
