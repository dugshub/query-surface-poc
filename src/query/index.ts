// Public surface of the query package.

export type {
  CatalogField,
  ColumnType,
  EntityCatalog,
  ExampleFilter,
  RelationshipInfo,
} from './catalog';
export {
  buildEntityCatalog,
  columnTypeFromDataType,
  columnTypeFromPg,
} from './catalog';
export type {
  EntityKind,
  EntityMeta,
  FieldMeta,
  FieldMetaMap,
} from './define-entity';
export { qEntity, qField, qJunction, readEntityMeta } from './define-entity';
export type {
  DiagnoseOptions,
  Finding,
  FindingCode,
  FormatOptions,
  Severity,
} from './doctor';
export { diagnose, formatFindings } from './doctor';
export { compile } from './engine/compiler';
export { runFetch, runSearch, runSearchMulti } from './engine/runners';
export type {
  FetchOptions,
  QueryOptions,
  QueryServiceOptions,
  ScopeResolver,
} from './query.application-service';
export { QueryApplicationService } from './query.application-service';
export type {
  EavStrategy,
  EntityDescriptor,
  EntityRegistration,
  RelDescriptor,
} from './registry';
export { buildRegistry, configureQueryRegistry, registry } from './registry';
export type {
  CatalogEntry,
  TableCatalog,
  ValueTableCatalog,
} from './runtime-registry';
export { entityRegistrations, loadRegistrations } from './runtime-registry';
export type { RegisterSchemaOptions } from './schema-registry';
export {
  buildRegistrationsFromSchema,
  registerFromDb,
  registerSchema,
} from './schema-registry';
export type {
  EntityName,
  FetchRequest,
  FetchResponse,
  FilterExpression,
  LeafFilter,
  Op,
  SearchEntityResult,
  SearchRequest,
  SearchResponse,
  SingleSearchQuery,
  Sort,
} from './types';
