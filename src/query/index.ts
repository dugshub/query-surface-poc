// Public surface of the query package.

export { QueryApplicationService } from './query.application-service';
export type { QueryOptions, FetchOptions, ScopeResolver, QueryServiceOptions } from './query.application-service';
export { buildEntityCatalog, columnTypeFromPg, columnTypeFromDataType } from './catalog';
export type {
  EntityCatalog,
  CatalogField,
  ColumnType,
  RelationshipInfo,
  ExampleFilter,
} from './catalog';
export { qEntity, qJunction, qField, readEntityMeta } from './define-entity';
export type { FieldMeta, EntityMeta, EntityKind, FieldMetaMap } from './define-entity';
export { diagnose, formatFindings } from './doctor';
export type { Finding, FindingCode, Severity, DiagnoseOptions, FormatOptions } from './doctor';
export { runSearch, runSearchMulti, runFetch } from './engine/runners';
export { compile, UnsupportedPredicateOpError } from './engine/compiler';
// The PUBLIC filter language — the resolved Predicate subset (RFC-0002 §4).
export type {
  Predicate,
  Binding,
  Path,
  Literal,
  CmpOp,
  StrOp,
  UnaryOp,
  BoolOp,
} from './predicate';
export { field, lit, cmp, str, unary, and, or, notP } from './predicate';
export { registry } from './registry';
export { configureQueryRegistry, buildRegistry } from './registry';
export type { EntityRegistration, EntityDescriptor, RelDescriptor, EavStrategy } from './registry';
export { loadRegistrations, entityRegistrations } from './runtime-registry';
export type { TableCatalog, ValueTableCatalog, CatalogEntry } from './runtime-registry';
export { registerSchema, registerFromDb, buildRegistrationsFromSchema } from './schema-registry';
export type { RegisterSchemaOptions } from './schema-registry';
export type {
  EntityName,
  FetchRequest,
  FetchResponse,
  SearchEntityResult,
  SearchRequest,
  SearchResponse,
  SingleSearchQuery,
  Sort,
} from './types';
