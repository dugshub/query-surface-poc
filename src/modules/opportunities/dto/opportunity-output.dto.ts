import { z } from 'zod';

export const OpportunityOutputSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid().nullable(),
  externalId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  stage: z.enum(['prospect', 'qualifying', 'presenting', 'negotiation', 'closing', 'won', 'lost']).nullable(),
  amount: z.number().int().nullable(),
  closeDate: z.coerce.date().nullable(),
  nextStep: z.string().nullable(),
  probability: z.number().int().nullable(),
  isClosed: z.boolean(),
  isWon: z.boolean(),
  stateOfDeal: z.string().nullable(),
  stateOfDealStatus: z.string().nullable(),
  isVisible: z.boolean(),
  emailDomains: z.unknown().nullable(),
  providerMetadata: z.unknown().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type OpportunityOutputDto = z.infer<typeof OpportunityOutputSchema>;
