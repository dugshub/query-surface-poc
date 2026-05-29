import type { ReactNode } from 'react';

// Dependency-free entity glyphs (lucide-style, 24 viewBox, currentColor stroke).
// Keyed by the known sales entities; anything else falls back to a generic table.
const GLYPHS: Record<string, ReactNode> = {
  accounts: (<>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
  </>),
  contacts: (<>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </>),
  opportunities: (<>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </>),
  emails: (<>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </>),
  transcripts: (<>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>),
  transcript_observations: (<>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>),
};

const FALLBACK: ReactNode = (<>
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
</>);

export function EntityIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[name] ?? FALLBACK}
    </svg>
  );
}
