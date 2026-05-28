import { useState } from 'react';
import { SEEDS } from '../seeds';
import { shareUrl, type HistEntry, type Snapshot } from '../url';

interface Props {
  snapshot: Snapshot;
  history: HistEntry[];
  onLoad: (snap: Snapshot) => void;
  onClearHistory: () => void;
}

const copy = (text: string) => { void navigator.clipboard?.writeText(text); };
const ago = (ts: number, now: number): string => {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
};

/** Header controls — share the current query as a URL, load an example, or replay history. */
export function QueryBar({ snapshot, history, onLoad, onClearHistory }: Props) {
  const [shared, setShared] = useState(false);
  const now = Date.now();

  const share = () => {
    copy(shareUrl(snapshot));
    setShared(true);
    setTimeout(() => setShared(false), 1400);
  };

  return (
    <div className="qbar">
      <button className="ghost" onClick={share} disabled={!snapshot.entity} title="Copy a shareable URL of this query">
        {shared ? '✓ copied' : 'Share'}
      </button>

      <details className="dd">
        <summary className="ghost">Examples ▾</summary>
        <div className="dd-panel">
          {SEEDS.map((s) => (
            <button key={s.label} className="dd-item" title={s.hint} onClick={(e) => { close(e); onLoad(s.snap); }}>
              <span className="dd-label">{s.label}</span>
              <span className="dd-hint">{s.hint}</span>
            </button>
          ))}
        </div>
      </details>

      <details className="dd">
        <summary className="ghost">History ▾</summary>
        <div className="dd-panel">
          {history.length === 0 && <div className="dd-empty">no history yet</div>}
          {history.map((h, i) => (
            <button key={i} className="dd-item" onClick={(e) => { close(e); onLoad(h.snap); }}>
              <span className="dd-label">{h.label}</span>
              <span className="dd-hint">{ago(h.ts, now)} ago</span>
            </button>
          ))}
          {history.length > 0 && (
            <button className="dd-item dd-clear" onClick={(e) => { close(e); onClearHistory(); }}>clear history</button>
          )}
        </div>
      </details>
    </div>
  );
}

// Close the enclosing <details> after a selection.
function close(e: { currentTarget: HTMLElement }) {
  e.currentTarget.closest('details')?.removeAttribute('open');
}
