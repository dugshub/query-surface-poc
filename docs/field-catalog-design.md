# Field Catalog — design

> Status: accepted (design). Supersedes the agent-schema parts of
> `upstream-kit-contributions.md` (Priority 3/4). Implementation in progress.

## Problem

The agent-facing schema layer (`agent-schema.ts`, `preview.ts`, the MCP
`instructions`, the `EntityName`/`Op` enums) is hand-authored and restates facts
that already live elsewhere:

- **mechanical facts** (columns, types, enums, nullable, relationships,
  searchable defaults) are already derived from Drizzle by `build-registry.ts`
  for the *compiler* — but `agent-schema.ts` re-declares them by hand for the
  *agent*. They drift silently (today: the agent's stated `searchableColumns`
  for `transcript` disagrees with what the engine actually fans out over).
- **semantic facts** (label, description/note, enum options, "which columns to
  show") already live in `field_definitions` for every EAV/CRM field — but the
  query surface loads only 5 of its columns and ignores `description`,
  `isKeyField`, `keyFieldOrder`.

Net: adding one column can require edits in up to 5 files, 3 of which don't
fail the typecheck if you forget.

## Key facts (from the investigation)

- In **dealbrain proper**, `field_definitions` is a *general CRM field catalog*,
  not EAV-only. Salesforce `describe` imports every standard + custom field as a
  row. It carries `label`, `description` (AI-generated semantic description),
  `selectOptions`, `dataType`, `isKeyField` + `keyFieldOrder` (the curated,
  user-orderable "key fields" list that drives the ODP overview table), `group`,
  `fieldKind`, `semanticQueries`, …
- `isKeyField` + `keyFieldOrder` **is** the curated preview list. `description`
  **is** the per-column note. The POC just isn't reading them.
- **codegen-patterns** already emits a per-entity field-meta catalog
  (`<entity>Fields` + `<entity>Metadata { primaryFields, searchFields }`) from
  `ui_label` / `ui_importance:'primary'` / `ui_filterable` — but frontend-only,
  and never unified with EAV. Precedent for the *shape*, not a reusable backend
  catalog.

## Three tiers of fields

| Tier | Example (POC) | Mechanics from | Semantics from |
|---|---|---|---|
| 1. CRM-origin (EAV) | `StageName`, `Amount`, `Industry`, `Tier` | `field_definitions.dataType` / `selectOptions` | `field_definitions` (label, description, isKeyField) — **complete** |
| 2. dealbrain-native columns | `name`, `stateOfDeal`, `account_id` | Drizzle introspection | **catalogued nowhere** → thin sidecar |
| 3. structural | `id`, FKs, timestamps | Drizzle introspection | derived defaults |

The only irreducible hand-authored surface is **tier-2 semantics + entity
summary + cross-field examples**. For EAV entities the sidecar contributes ~zero.

## Decisions

1. **Introspection-first; codegen optional.** The mechanical registry is never
   codegenned (introspection can't drift). Codegen's only future role is
   scaffolding the sidecar stub.
2. **Catalog-shaped, query-surface consumer only (this round).** Build a clean,
   consumer-agnostic `FieldCatalog` abstraction; wire only agent-schema/preview
   now. Shaped so dealbrain's prompt-variable union / UI columns / export can
   consume it later. **No changes to dealbrain proper.**
3. **Precedence by facet:** mechanics (type / nullable / enum / relationships)
   = Drizzle, authoritative. semantics (label / note / preview / searchable)
   = `field_definitions` when present, else sidecar, else derived default.
4. **Sidecar per entity** (`<entity>.query.ts`), thin — tier-2 only.
5. A **boot/test reconciler** asserts sidecar keys resolve to real columns and
   that stated-searchable == engine-derived-searchable (kills the live drift).

## The contract

```ts
type Facet = 'type' | 'nullable' | 'enumValues' | 'label' | 'note'
           | 'group' | 'searchable' | 'preview';
type FacetSource = 'drizzle' | 'field_definition' | 'sidecar' | 'derived';

interface CatalogField {
  key: string;                 // what the agent puts in `on:` — 'StageName' | 'name'
  column?: string;             // backing camelCase real column; absent for EAV-only fields
  // mechanics — Drizzle for native; field_def.dataType/selectOptions for EAV-only
  type: ColumnType;            // uuid|string|integer|number|datetime|date|boolean|json|enum
  nullable: boolean;
  enumValues?: readonly string[];
  // semantics — field_def → sidecar → derived
  label?: string;
  note?: string;
  group?: string;
  // behavior
  searchable: boolean;         // deriveSearchableColumns default; sidecar may override
  preview: boolean;            // field_def.isKeyField | sidecar | derived default
  previewOrder?: number;       // field_def.keyFieldOrder
  sources: Partial<Record<Facet, FacetSource>>;  // provenance, for the reconciler/debug
}

interface EntityCatalog {
  entity: EntityName;
  summary?: string;            // sidecar (entity-level)
  fields: CatalogField[];
  relationships: RelationshipDescriptor[];   // from registry (introspected)
  examples?: ExampleFilter[];  // sidecar
}

// the single assembly point
function buildEntityCatalog(
  entity: EntityName,
  registry: EntityDescriptor,      // mechanics + relationships (introspected)
  fieldMap: FieldMap | undefined,  // tier-1 semantics (field_definitions)
  sidecar: EntitySidecar | undefined,  // tier-2 semantics + summary + examples
): EntityCatalog;
```

`agent-schema.getFullSchema/getEntitySchema` become **projections** of
`EntityCatalog` into the agent JSON. `preview.previewColumns/previewEavFields`
become `fields.filter(f => f.preview)` ordered by `previewOrder`. Nothing
hand-restates columns, types, enums, or searchable sets.

### Sidecar shape (`<entity>.query.ts`)

```ts
export const opportunityQueryMeta: EntitySidecar = {
  summary: 'A sales deal/opportunity attached to an account…',
  columns: {                                   // tier-2 native columns ONLY
    stateOfDeal:       { note: 'LLM-generated narrative of where the deal stands.', searchable: true },
    stateOfDealStatus: { note: 'Short status label: healthy|at_risk|closing|lost.' },
  },
  preview: ['name', 'account_id'],             // native cols to ADD to the isKeyField-derived preview
  examples: [ /* cross-field example filters */ ],
};
```

## Workstreams (DAG)

```
WS-A widen catalog load (field-map.ts: +description,+isKeyField,+keyFieldOrder)   ─┐
WS-B FieldCatalog builder + agent-schema projection                                ├─ critical path
WS-C preview from isKeyField/keyFieldOrder                                          │
WS-F reconciler (boot/test parity check)                                          ─┘  (after B)
WS-G thin sidecars per entity                                                          (after B)

WS-D single entity enumeration (EntityName/EntityNameSchema from one source)  ── independent*
WS-E collapse data_type + Op vocabularies; unify 3 coercion impls             ── independent*
```

\* WS-D/WS-E are conceptually independent but share `types.ts`/`zod-schemas.ts`
with each other and `agent-schema.ts` with WS-B. Run them as **sequential
passes against the stable `FieldCatalog` interface**, not concurrent worktrees —
parallelizing before the interface exists risks import cycles + merge churn.

## Out of scope (this round)

- Changes to dealbrain proper or its `field_definitions` table.
- A `searchable` / `preview` attribute in the codegen entity YAML (would re-couple
  to codegen; introspection + sidecar covers it).
- Wiring non-query consumers (prompt-variables, UI columns) to the catalog —
  the interface is shaped for it, but that's a later epic.
```
