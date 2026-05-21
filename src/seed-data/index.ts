// Aggregator for all per-deal seed files.
//
// Each `deal-NN-<slug>.ts` exports `deal: DealSeed`. This barrel re-exports
// them as a stable-ordered array so `src/seed.ts` can iterate and insert in
// dependency order (accounts → opportunities → contacts → emails → transcripts).
//
// Adding a new deal: drop another `deal-NN-<slug>.ts` and append to the list.
// Each file is self-contained; no cross-file references.

import { deal as deal01 } from './deal-01-acme';
import { deal as deal02 } from './deal-02-globex';
import { deal as deal03 } from './deal-03-initech';
import { deal as deal04 } from './deal-04-hooli';
import { deal as deal05 } from './deal-05-massive-dynamic';
import { deal as deal06 } from './deal-06-stark-industries';
import { deal as deal07 } from './deal-07-wayne-enterprises';
import { deal as deal08 } from './deal-08-soylent';
import { deal as deal09 } from './deal-09-vehement-capital';
import { deal as deal10 } from './deal-10-pied-piper';

import type { DealSeed } from './deal-types';

export const ALL_DEALS: readonly DealSeed[] = [
  deal01, deal02, deal03, deal04, deal05,
  deal06, deal07, deal08, deal09, deal10,
] as const;
