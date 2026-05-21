import { z } from 'zod';
import { CreateTranscriptSchema } from './create-transcript.dto';

export const UpdateTranscriptSchema = CreateTranscriptSchema.partial();

export type UpdateTranscriptDto = z.infer<typeof UpdateTranscriptSchema>;
