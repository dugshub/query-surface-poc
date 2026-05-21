import { z } from 'zod';
import { CreateOpportunitySchema } from './create-opportunity.dto';

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial();

export type UpdateOpportunityDto = z.infer<typeof UpdateOpportunitySchema>;
