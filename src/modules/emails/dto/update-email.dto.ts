import { z } from 'zod';
import { CreateEmailSchema } from './create-email.dto';

export const UpdateEmailSchema = CreateEmailSchema.partial();

export type UpdateEmailDto = z.infer<typeof UpdateEmailSchema>;
