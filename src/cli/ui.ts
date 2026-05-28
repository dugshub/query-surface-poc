// Minimal CLI presentation — semantic color tokens + output helpers, no deps.
//
// Borrows the codegen-patterns pattern: color tokens referenced by *role*
// (theme.success, theme.muted) rather than literal codes, and output helpers
// that no-op under --json. The chalk dependency is intentionally dropped — this
// is a CLI-only concern and library consumers shouldn't inherit it; swapping in
// chalk later (e.g. if folded into codegen-patterns) is a one-file change.
//
// Color is suppressed when stdout isn't a TTY (piped) or NO_COLOR is set.

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function paint(code: string): (s: string) => string {
  return (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
}

export const theme = {
  success: paint('32'),
  error: paint('31'),
  warning: paint('33'),
  system: paint('36'),
  muted: paint('90'),
  bold: paint('1'),
} as const;

export const icons = { success: '✓', error: '✗', warning: '!', info: 'ℹ' } as const;

// ---------------------------------------------------------------------------
// JSON mode — when on, human helpers no-op and structured output goes through
// printJson. Lets `--json` callers (CI / agents) get clean machine output.
// ---------------------------------------------------------------------------

let jsonMode = false;
export const setJsonMode = (on: boolean): void => void (jsonMode = on);
export const isJsonMode = (): boolean => jsonMode;
export const printJson = (data: unknown): void => console.log(JSON.stringify(data, null, 2));

export function printSuccess(msg: string): void {
  if (!jsonMode) console.log(`${theme.success(icons.success)} ${msg}`);
}
export function printError(msg: string): void {
  if (!jsonMode) console.error(`${theme.error(icons.error)} ${msg}`);
}
export function printWarning(msg: string): void {
  if (!jsonMode) console.warn(`${theme.warning(icons.warning)} ${msg}`);
}
export function printInfo(msg: string): void {
  if (!jsonMode) console.log(`${theme.system(icons.info)} ${msg}`);
}
export function printMuted(msg: string): void {
  if (!jsonMode) console.log(theme.muted(msg));
}
