// Semantic-layer PREVIEW model — mirrors codegen-patterns/runtime/analytics.
//
// NOT POWERED. The measure/dimension classification here is INFERRED from field
// types so the preview is populated; in the real system these facets are authored
// on qField() (SemanticFieldConfig: measure + agg, dimension + dimension_type, …)
// and a compiler emits a Cube.js schema. One metadata source then feeds BOTH the
// agent catalog (describe) and the metric layer. See codegen-patterns:
//   runtime/analytics/{types,metrics,specs}.ts · subsystems/analytics/cube-backend.ts
import { entityLabel, fieldLabel } from './labels';
import type { EntityCatalog } from './types';

// Vocabulary copied verbatim from runtime/analytics/types.ts.
export type AggregationType =
  | 'sum' | 'min' | 'max' | 'count' | 'count_distinct'
  | 'average' | 'median' | 'percentile' | 'sum_boolean';
export type DimensionKind = 'categorical' | 'time';
export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type MetricKind = 'simple' | 'derived' | 'ratio' | 'cumulative';

export interface InferredMeasure { key: string; label: string; agg: AggregationType; synthetic?: boolean; }
export interface InferredDimension { key: string; label: string; dimType: DimensionKind; granularity?: TimeGranularity; }
export interface ExampleMetric { name: string; kind: MetricKind; def: Record<string, unknown>; note: string; }
export interface SemanticModel {
  entity: string;
  measures: InferredMeasure[];
  dimensions: InferredDimension[];
  metrics: ExampleMetric[];
}

const aggForKey = (key: string): AggregationType => {
  const k = key.toLowerCase();
  if (/(probability|score|rate|percent|ratio|avg|average)/.test(k)) return 'average';
  return 'sum'; // amount / revenue / value / count-like → sum
};

const pascal = (s: string): string => s.replace(/(^|_)([a-z])/g, (_, __, c: string) => c.toUpperCase());

/** Infer an illustrative semantic model from the catalog (preview only). */
export function inferSemanticModel(cat: EntityCatalog): SemanticModel {
  const measures: InferredMeasure[] = [
    { key: '*', label: `Count of ${entityLabel(cat.entity)}`, agg: 'count', synthetic: true },
  ];
  const dimensions: InferredDimension[] = [];

  for (const f of cat.fields) {
    if (f.key === 'id' || f.type === 'uuid' || f.key === 'enableRLS') continue;
    if (f.type === 'number' || f.type === 'integer') {
      measures.push({ key: f.key, label: fieldLabel(f), agg: aggForKey(f.key) });
    } else if (f.type === 'date' || f.type === 'datetime') {
      dimensions.push({ key: f.key, label: fieldLabel(f), dimType: 'time', granularity: 'month' });
    } else if (f.type === 'enum' || f.type === 'boolean' || f.type === 'string') {
      dimensions.push({ key: f.key, label: fieldLabel(f), dimType: 'categorical' });
    }
  }

  return { entity: cat.entity, measures, dimensions, metrics: exampleMetrics(cat.entity, measures, dimensions) };
}

/** A few illustrative MetricDefinitions (one per kind, where the entity supports it). */
function exampleMetrics(entity: string, measures: InferredMeasure[], dimensions: InferredDimension[]): ExampleMetric[] {
  const out: ExampleMetric[] = [];
  const sumM = measures.find((m) => m.agg === 'sum' && m.key !== '*');
  const enumDim = dimensions.find((d) => d.dimType === 'categorical');
  const timeDim = dimensions.find((d) => d.dimType === 'time');
  const countName = `${entity}_count`;

  out.push({ name: countName, kind: 'simple', def: { type: 'simple', measure: '*', agg: 'count' }, note: `Count of ${entity}.` });
  if (sumM) out.push({ name: `total_${sumM.key}`, kind: 'simple', def: { type: 'simple', measure: sumM.key, agg: 'sum' }, note: `Total ${sumM.label}.` });
  if (enumDim) out.push({
    name: `${enumDim.key}_rate`, kind: 'ratio',
    def: { type: 'ratio', numerator: { type: 'simple', measure: '*', agg: 'count', filter: `${enumDim.key} = '<value>'` }, denominator: { type: 'simple', measure: '*', agg: 'count' } },
    note: `Share of ${entity} where ${enumDim.label} matches a value (e.g. win rate).`,
  });
  if (sumM) out.push({
    name: `avg_${sumM.key}`, kind: 'derived',
    def: { type: 'derived', expr: `total_${sumM.key} / ${countName}`, metrics: [`total_${sumM.key}`, countName] },
    note: `Average ${sumM.label} per ${entity}.`,
  });
  if (sumM && timeDim) out.push({
    name: `${sumM.key}_mtd`, kind: 'cumulative',
    def: { type: 'cumulative', measure: sumM.key, grain_to_date: 'month' },
    note: `${sumM.label} accumulated month-to-date (by ${timeDim.label}).`,
  });
  return out;
}

const measureName = (key: string): string => (key === '*' ? 'count' : key);

/** Serialize a measures×dimensions selection into the Cube.js query + the
 *  IAnalyticsQuery.execute(...) call it maps to (cube-backend.ts contract). */
export function cubeQuery(entity: string, measureKeys: string[], dimKeys: string[]): { cube: string; query: object; call: string } {
  const cube = pascal(entity);
  const query = {
    measures: measureKeys.map((k) => `${cube}.${measureName(k)}`),
    dimensions: dimKeys.map((k) => `${cube}.${k}`),
    limit: 100,
  };
  const call = [
    'analytics.execute(',
    `  ${JSON.stringify(cube)},`,
    `  ${JSON.stringify(measureKeys.map(measureName))},   // measures`,
    `  ${JSON.stringify(dimKeys)},   // group-by dimensions`,
    '  {},                  // where (FilterExpression → Cube filters)',
    '  { limit: 100 },',
    ')',
  ].join('\n');
  return { cube, query, call };
}
