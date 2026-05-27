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
export type { FieldMeta, EntityMeta, FieldMetaMap } from './define-entity';
export { runSearch, runSearchMulti, runFetch } from './engine/runners';
export { compile } from './engine/compiler';
export { registry } from '../generated/query-registry';
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
