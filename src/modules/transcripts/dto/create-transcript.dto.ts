import { z } from 'zod';

export const CreateTranscriptSchema = z.object({
  opportunityId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  occurredAt: z.coerce.date(),
  title: z.string(),
  source: z.enum(['zoom', 'google_meet', 'manual', 'gong', 'granola']),
  durationMinutes: z.number().int().nullable(),
  participants: z.string().nullable(),
});

export type CreateTranscriptDto = z.infer<typeof CreateTranscriptSchema>;
