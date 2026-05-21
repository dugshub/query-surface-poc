import { z } from 'zod';

export const ContactOutputSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  providerMetadata: z.unknown().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ContactOutputDto = z.infer<typeof ContactOutputSchema>;
