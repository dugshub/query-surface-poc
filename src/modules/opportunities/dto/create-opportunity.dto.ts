import { z } from 'zod';

export const CreateOpportunitySchema = z.object({
  accountId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  userId: z.string().uuid(),
  name: z.string(),
  stage: z.enum(['prospect', 'qualifying', 'presenting', 'negotiation', 'closing', 'won', 'lost']),
  amount: z.number().int().nullable(),
  closeDate: z.coerce.date().nullable(),
});

export type CreateOpportunityDto = z.infer<typeof CreateOpportunitySchema>;
