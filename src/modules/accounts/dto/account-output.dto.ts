import { z } from 'zod';

export const AccountOutputSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  name: z.string(),
  website: z.string().nullable(),
  providerMetadata: z.unknown().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AccountOutputDto = z.infer<typeof AccountOutputSchema>;
