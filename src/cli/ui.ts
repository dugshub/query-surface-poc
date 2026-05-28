// Terminal presentation for the query-surface CLI — dependency-free.
//
// Borrows the vocabulary of two siblings, implemented with raw ANSI (no chalk /
// picocolors) so library consumers inherit no CLI dependency:
//   - codegen-patterns: semantic theme tokens, panes, icons (ASCII fallback), hints
//   - dugshub/stack:     node glyphs + recursive tree connectors for the graph
//
// Color is suppressed off-TTY / under NO_COLOR (FORCE_COLOR overrides). Glyphs
// fall back to ASCII when Unicode isn't safe (dumb terminal / CI).

const useColor =
  (Boolean(process.stdout.isTTY) && !process.env.NO_COLOR) || Boolean(process.env.FORCE_COLOR);
const unicode = Boolean(process.stdout.isTTY) && process.env.TERM !== 'dumb' && !process.env.CI;

function paint(code: string): (s: string) => string {
  return (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
}

// Semantic roles → ANSI codes. Retheme here; commands never reference codes.
export const theme = {
  success: paint('32'),
  error: paint('31'),
  warning: paint('33'),
  info: paint('36'),
  muted: paint('90'),
  bold: paint('1'),
  accent: paint('96'), // bright cyan
  entity: paint('95'), // bright magenta — node identity (mirrors stack's stack color)
  rel: paint('94'), // bright blue — relationship edges
  enum: paint('93'), // bright yellow — enum values
} as const;

// Glyphs with ASCII fallback. Node dots + tree connectors + status icons.
export const glyph = unicode
  ? {
      node: '●', current: '◉', root: '◇', join: '◆',
      tee: '├─', elbow: '└─', pipe: '│ ', gap: '  ',
      arrowR: '→', arrowL: '←', returns: '↩',
      ok: '✓', err: '✗', warn: '⚠', info: '◆', bullet: '▸',
    }
  : {
      node: '*', current: '(*)', root: '<>', join: '<>',
      tee: '+-', elbow: '`-', pipe: '| ', gap: '  ',
      arrowR: '->', arrowL: '<-', returns: '<~',
      ok: '[OK]', err: '[X]', warn: '[!]', info: '[i]', bullet: '>',
    };

// ---------------------------------------------------------------------------
// JSON mode — human helpers no-op; structured output goes through printJson.
// ---------------------------------------------------------------------------

let jsonMode = false;
export const setJsonMode = (on: boolean): void => void (jsonMode = on);
export const isJsonMode = (): boolean => jsonMode;
export const printJson = (data: unknown): void => console.log(JSON.stringify(data, null, 2));

// ---------------------------------------------------------------------------
// Width-aware helpers — strip ANSI before measuring / padding.
// ---------------------------------------------------------------------------

const ANSI = /\x1b\[[0-9;]*m/g;
export const plainLen = (s: string): number => s.replace(ANSI, '').length;
export const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, Math.max(1, max - 1)) + '…';
/** Pad the *plain* text to width, then optionally color the whole cell. */
export function pad(text: string, width: number, color?: (s: string) => string): string {
  const padded = text + ' '.repeat(Math.max(0, width - text.length));
  return color ? color(padded) : padded;
}

// ---------------------------------------------------------------------------
// Output primitives.
// ---------------------------------------------------------------------------

export function printSuccess(msg: string): void {
  if (!jsonMode) console.log(`${theme.success(glyph.ok)} ${msg}`);
}
export function printError(msg: string): void {
  if (!jsonMode) console.error(`${theme.error(glyph.err)} ${msg}`);
}
export function printWarning(msg: string): void {
  if (!jsonMode) console.warn(`${theme.warning(glyph.warn)} ${msg}`);
}
export function printInfo(msg: string): void {
  if (!jsonMode) console.log(`${theme.info(glyph.info)} ${msg}`);
}
export function printMuted(msg: string): void {
  if (!jsonMode) console.log(theme.muted(msg));
}
export function heading(text: string): void {
  if (!jsonMode) console.log(theme.bold(text));
}
export function blank(): void {
  if (!jsonMode) console.log('');
}

/** Word-wrap a plain string to a max width. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

/** Boxed pane: `┌─ title ──┐` … `└────────┘`. Body lines are word-wrapped. */
export function printPane(title: string, body: string[], footer?: string): void {
  if (jsonMode) return;
  const cols = process.stdout.columns ?? 80;
  const width = Math.min(Math.max(48, cols), 96);
  const inner = width - 4;
  const dashes = Math.max(0, width - plainLen(title) - 5);
  console.log(theme.muted('┌─ ') + theme.bold(title) + theme.muted(' ' + '─'.repeat(dashes) + '┐'));
  for (const raw of body) {
    // Pre-colored lines print as-is (caller owns layout); plain lines wrap + mute.
    if (raw.includes('\x1b')) console.log('  ' + raw);
    else for (const w of wrap(raw, inner)) console.log('  ' + theme.muted(w));
  }
  if (footer) {
    console.log('');
    console.log('  ' + theme.muted(footer));
  }
  console.log(theme.muted('└' + '─'.repeat(Math.max(2, width - 2)) + '┘'));
}

/** "Next:" suggested-command block. */
export function printHints(hints: { cmd: string; desc: string }[]): void {
  if (jsonMode || hints.length === 0) return;
  console.log('');
  console.log(theme.muted('Next:'));
  const w = Math.max(...hints.map((h) => h.cmd.length));
  for (const h of hints) {
    console.log(`  ${theme.accent(h.cmd)}${' '.repeat(w - h.cmd.length + 2)}${theme.muted(h.desc)}`);
  }
}
