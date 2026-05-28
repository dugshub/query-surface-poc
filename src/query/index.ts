// Public surface of the query module.

export { QueryApplicationService } from './query.application-service';
export type { QueryOptions, FetchOptions } from './query.application-service';
export { buildEntityCatalog, columnTypeFromPg, columnTypeFromDataType } from './catalog';
export type {
  EntityCatalog,
  CatalogField,
  ColumnType,
  RelationshipInfo,
  ExampleFilter,
} from './catalog';
export { defineEntity, qField, readEntityMeta } from './define-entity';
export type { FieldMeta, EntityMeta, FieldMetaMap } from './define-entity';
export { diagnose, formatFindings } from './doctor';
export type { Finding, FindingCode, Severity, DiagnoseOptions } from './doctor';
export { runSearch, runSearchMulti, runFetch } from './engine/runners';
export { compile } from './engine/compiler';
export { QueryModule } from './query.module';
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
  FilterExpression,
  LeafFilter,
  Op,
  SearchEntityResult,
  SearchRequest,
  SearchResponse,
  SingleSearchQuery,
  Sort,
} from './types';
