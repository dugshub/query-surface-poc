import { z } from 'zod';

export const CreateContactSchema = z.object({
  accountId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  providerMetadata: z.unknown().nullable(),
});

export type CreateContactDto = z.infer<typeof CreateContactSchema>;
