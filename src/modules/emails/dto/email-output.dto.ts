import { z } from 'zod';

export const EmailOutputSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  occurredAt: z.coerce.date(),
  subject: z.string(),
  body: z.string(),
  fromEmail: z.string(),
  toEmail: z.string(),
  direction: z.enum(['inbound', 'outbound']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export type EmailOutputDto = z.infer<typeof EmailOutputSchema>;
