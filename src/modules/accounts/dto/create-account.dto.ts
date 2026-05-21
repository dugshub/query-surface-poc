import { z } from 'zod';

export const CreateAccountSchema = z.object({
  externalId: z.string().nullable(),
  userId: z.string().uuid(),
  name: z.string(),
  industry: z.enum(['fintech', 'saas', 'retail', 'health', 'manufacturing', 'other']).nullable(),
  domain: z.string().nullable(),
  employeeCount: z.number().int().nullable(),
});

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
