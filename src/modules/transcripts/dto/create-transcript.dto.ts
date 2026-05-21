import { z } from 'zod';

export const CreateTranscriptSchema = z.object({
  opportunityId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  externalId: z.string().nullable(),
  source: z.enum(['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom']),
  title: z.string(),
  creatorName: z.string().nullable(),
  creatorEmail: z.string().nullable(),
  attendeeEmails: z.unknown().nullable(),
  userNotes: z.string().nullable(),
  enhancedNotes: z.string().nullable(),
  transcript: z.string().nullable(),
  summary: z.string().nullable(),
  occurredAt: z.coerce.date(),
  externalLink: z.string().nullable(),
  scope: z.enum(['external', 'internal', 'unknown']).nullable(),
  language: z.string().nullable(),
  duration: z.number().int().nullable(),
  rawData: z.unknown().nullable(),
});

export type CreateTranscriptDto = z.infer<typeof CreateTranscriptSchema>;
