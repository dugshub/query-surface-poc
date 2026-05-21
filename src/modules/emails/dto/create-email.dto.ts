import { z } from 'zod';

export const CreateEmailSchema = z.object({
  opportunityId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  occurredAt: z.coerce.date(),
  subject: z.string(),
  body: z.string(),
  fromEmail: z.string(),
  toEmail: z.string(),
  direction: z.enum(['inbound', 'outbound']),
});

export type CreateEmailDto = z.infer<typeof CreateEmailSchema>;
