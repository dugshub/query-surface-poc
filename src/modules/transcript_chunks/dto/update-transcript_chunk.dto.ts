import { z } from 'zod';
import { CreateTranscriptChunkSchema } from './create-transcript_chunk.dto';

export const UpdateTranscriptChunkSchema = CreateTranscriptChunkSchema.partial();

export type UpdateTranscriptChunkDto = z.infer<typeof UpdateTranscriptChunkSchema>;
