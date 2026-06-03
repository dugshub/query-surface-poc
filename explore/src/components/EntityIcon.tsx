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
    {/* price tag (no $) */}
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r="1.25" />
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
  communications: (<>
    {/* two overlapping bubbles — the base/family of emails + meetings */}
    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
  </>),
  meetings: (<>
    {/* video camera — calls */}
    <path d="m22 8-6 4 6 4V8Z" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </>),
  people: (<>
    {/* group of people — the identity pillar (vs contacts' single person) */}
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
