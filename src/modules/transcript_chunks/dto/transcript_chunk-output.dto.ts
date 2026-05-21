import { z } from 'zod';

export const TranscriptChunkOutputSchema = z.object({
  id: z.string().uuid(),
  transcriptId: z.string().uuid().nullable(),
  position: z.number().int(),
  speaker: z.enum(['seller', 'buyer', 'unknown']).nullable(),
  body: z.string(),
  startsAtSec: z.number().int().nullable(),
  endsAtSec: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TranscriptChunkOutputDto = z.infer<typeof TranscriptChunkOutputSchema>;
