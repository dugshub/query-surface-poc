import { z } from 'zod';

export const TranscriptOutputSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  occurredAt: z.coerce.date(),
  title: z.string(),
  source: z.enum(['zoom', 'google_meet', 'manual', 'gong', 'granola']),
  durationMinutes: z.number().int().nullable(),
  participants: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export type TranscriptOutputDto = z.infer<typeof TranscriptOutputSchema>;
