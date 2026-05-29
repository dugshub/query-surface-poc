import { useMemo, useState } from 'react';
import { cubeQuery, inferSemanticModel, type AggregationType, type MetricKind } from '../semantic';
import type { EntityCatalog } from '../types';

const AGG_LABEL: Record<AggregationType, string> = {
  sum: '∑ sum', count: '# count', count_distinct: '# distinct', average: 'x̄ avg',
  min: 'min', max: 'max', median: 'median', percentile: 'pct', sum_boolean: '∑ bool',
};
const KIND_CLASS: Record<MetricKind, string> = {
  simple: 'k-simple', derived: 'k-derived', ratio: 'k-ratio', cumulative: 'k-cumulative',
};

/**
 * Semantic-layer PREVIEW — visualizes where Cube.js metrics/dimensions land on
 * top of the same fields the agent catalog exposes. Not powered (see semantic.ts).
 */
export function MetricsPanel({ catalog }: { catalog: EntityCatalog }) {
  const model = useMemo(() => inferSemanticModel(catalog), [catalog]);
  const [measures, setMeasures] = useState<Set<string>>(() => new Set(['*']));
  const [dims, setDims] = useState<Set<string>>(() => new Set(model.dimensions[0] ? [model.dimensions[0].key] : []));

  const toggle = (set: Set<string>, setSet: (s: Set<string>) => void, k: string) => {
    const n = new Set(set);
    n.has(k) ? n.delete(k) : n.add(k);
    setSet(n);
  };
  const q = cubeQuery(model.entity, [...measures], [...dims]);

  return (
    <div className="results metrics">
      <div className="preview-banner">
        <b>Semantic layer · preview</b> — not powered yet. Measures &amp; dimensions below are <i>inferred from field
        types</i>; in the real system they're authored on <code>qField()</code> (<code>measure</code> + <code>agg</code>,
        {' '}<code>dimension</code> + <code>dimension_type</code>) and compiled to a Cube.js schema. One metadata source
        feeds <b>both</b> the agent catalog (<code>describe</code>) and the metric layer.
      </div>

      <div className="metrics-cols">
        <section>
          <div className="field-section">measures <span className="muted">— aggregatable</span></div>
          {model.measures.map((m) => (
            <label className="field" key={m.key}>
              <input type="checkbox" checked={measures.has(m.key)} onChange={() => toggle(measures, setMeasures, m.key)} />
              <span className="fname">{m.key === '*' ? m.label : m.key}</span>
              <span className="agg-badge">{AGG_LABEL[m.agg]}</span>
            </label>
          ))}

          <div className="field-section">dimensions <span className="muted">— group by</span></div>
          {model.dimensions.map((d) => (
            <label className="field" key={d.key}>
              <input type="checkbox" checked={dims.has(d.key)} onChange={() => toggle(dims, setDims, d.key)} />
              <span className="fname">{d.key}</span>
              <span className={'tag dim-' + d.dimType}>{d.dimType}{d.granularity ? ` · ${d.granularity}` : ''}</span>
            </label>
          ))}
        </section>

        <section>
          <div className="field-section">metric query → Cube.js (preview)</div>
          <pre className="code">{JSON.stringify(q.query, null, 2)}</pre>
          <div className="field-section">analytics port — IAnalyticsQuery.execute</div>
          <pre className="code">{q.call}</pre>
          <div className="not-wired">
            ⚠ Not wired — a metric run arrives when <code>qField()</code> carries the measure/dimension facets and the
            field-metadata → Cube schema compiler lands (the missing bridge in codegen-patterns). Today the surface does
            search/fetch; aggregation stays in Cube.
          </div>
        </section>
      </div>

      <div className="field-section">metrics — composed (simple · derived · ratio · cumulative)</div>
      <div className="metric-gallery">
        {model.metrics.map((m) => (
          <div className="metric-card" key={m.name}>
            <div className="metric-head">
              <span className={'kind ' + KIND_CLASS[m.kind]}>{m.kind}</span>
              <code>{m.name}</code>
            </div>
            <div className="metric-note">{m.note}</div>
            <pre className="code small">{JSON.stringify(m.def, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
