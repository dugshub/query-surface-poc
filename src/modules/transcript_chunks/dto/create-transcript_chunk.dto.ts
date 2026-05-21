import { z } from 'zod';

export const CreateTranscriptChunkSchema = z.object({
  transcriptId: z.string().uuid().nullable(),
  position: z.number().int(),
  speaker: z.enum(['seller', 'buyer', 'unknown']).nullable(),
  body: z.string(),
  startsAtSec: z.number().int().nullable(),
  endsAtSec: z.number().int().nullable(),
});

export type CreateTranscriptChunkDto = z.infer<typeof CreateTranscriptChunkSchema>;
