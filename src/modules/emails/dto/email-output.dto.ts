import { z } from 'zod';

export const EmailOutputSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
  tenantId: z.string().uuid().nullable(),
  accountId: z.string().uuid().nullable(),
  contactId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  source: z.string().nullable(),
  occurredAt: z.coerce.date(),
  subject: z.string().nullable(),
  bodyText: z.string().nullable(),
  fromAddress: z.string(),
  toAddresses: z.unknown().nullable(),
  ccAddresses: z.unknown().nullable(),
  direction: z.enum(['inbound', 'outbound']),
  threadId: z.string().nullable(),
  messageId: z.string().nullable(),
  inReplyTo: z.string().nullable(),
  hasAttachments: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type EmailOutputDto = z.infer<typeof EmailOutputSchema>;
