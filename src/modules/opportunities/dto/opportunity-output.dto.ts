import { z } from 'zod';

export const OpportunityOutputSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  userId: z.string().uuid(),
  name: z.string(),
  stage: z.enum(['prospect', 'qualifying', 'presenting', 'negotiation', 'closing', 'won', 'lost']),
  amount: z.number().int().nullable(),
  closeDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export type OpportunityOutputDto = z.infer<typeof OpportunityOutputSchema>;
