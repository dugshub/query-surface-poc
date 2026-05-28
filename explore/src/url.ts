// Save / share / history. A Snapshot is the shareable form of the whole Explore
// state — the builder TREE (not the compiled filter, which is derived) plus
// entity / columns / sort / paging. Encoded into the URL hash so a query is a
// link; mirrored into localStorage as recent history.
import type { FGroup } from './filter';
import type { Sort } from './types';

export interface Snapshot {
  entity: string | null;
  tree: FGroup;
  columns: string[];
  sort: Sort[];
  limit: number;
  offset: number;
}

// btoa/atob with a round-trip through encodeURIComponent so non-ASCII survives.
const enc = (s: Snapshot): string => btoa(encodeURIComponent(JSON.stringify(s)));
const dec = (raw: string): Snapshot | null => {
  try { return JSON.parse(decodeURIComponent(atob(raw))) as Snapshot; } catch { return null; }
};

export function writeHash(s: Snapshot): void {
  history.replaceState(null, '', '#' + enc(s));
}
export function readHash(): Snapshot | null {
  const raw = location.hash.replace(/^#/, '');
  return raw ? dec(raw) : null;
}
export function shareUrl(s: Snapshot): string {
  return location.origin + location.pathname + '#' + enc(s);
}

// ── recent history (localStorage) ────────────────────────────────────────────
const HKEY = 'qsp-explore-history';
const MAX = 25;

export interface HistEntry { ts: number; label: string; snap: Snapshot; }

export function loadHistory(): HistEntry[] {
  try { return JSON.parse(localStorage.getItem(HKEY) ?? '[]') as HistEntry[]; } catch { return []; }
}
function persist(h: HistEntry[]): void {
  try { localStorage.setItem(HKEY, JSON.stringify(h.slice(0, MAX))); } catch { /* ignore quota */ }
}
export function clearHistory(): void {
  try { localStorage.removeItem(HKEY); } catch { /* ignore */ }
}

/** Identity ignoring paging — so prev/next doesn't spam history. */
const key = (s: Snapshot): string => JSON.stringify({ e: s.entity, t: s.tree, c: s.columns, s: s.sort });

export function pushHistory(h: HistEntry[], entry: HistEntry): HistEntry[] {
  if (h[0] && key(h[0].snap) === key(entry.snap)) {
    const next = [entry, ...h.slice(1)];   // refresh ts, keep position
    persist(next);
    return next;
  }
  const next = [entry, ...h].slice(0, MAX);
  persist(next);
  return next;
}

export function summarize(s: Snapshot): string {
  const parts = [s.entity ?? '—'];
  const leaves = countLeaves(s.tree);
  if (leaves) parts.push(`${leaves} filter${leaves === 1 ? '' : 's'}`);
  if (s.columns.length) parts.push(`${s.columns.length} col`);
  if (s.sort.length) parts.push(`sort ${s.sort[0].field}`);
  return parts.join(' · ');
}
function countLeaves(node: FGroup): number {
  let n = 0;
  for (const c of node.children) n += c.kind === 'group' ? countLeaves(c) : 1;
  return n;
}
