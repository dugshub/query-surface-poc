import { z } from 'zod';

export const AccountOutputSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string().nullable(),
  userId: z.string().uuid(),
  name: z.string(),
  industry: z.enum(['fintech', 'saas', 'retail', 'health', 'manufacturing', 'other']).nullable(),
  domain: z.string().nullable(),
  employeeCount: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export type AccountOutputDto = z.infer<typeof AccountOutputSchema>;
