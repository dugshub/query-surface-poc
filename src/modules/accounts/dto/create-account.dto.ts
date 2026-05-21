import { z } from 'zod';

export const CreateAccountSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  name: z.string(),
  website: z.string().nullable(),
  providerMetadata: z.unknown().nullable(),
});

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
