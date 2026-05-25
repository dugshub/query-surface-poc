import { BadRequestException, Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '@shared/http/pagination';
import type { FilterExpression } from '../../query/types';
import { TranscriptService } from './transcript.service';
import { FindTranscriptByIdUseCase } from './use-cases/find-transcript-by-id.use-case';
import { ListTranscriptsUseCase } from './use-cases/list-transcripts.use-case';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { CreateTranscriptUseCase } from './use-cases/create-transcript.use-case';
import { UpdateTranscriptUseCase } from './use-cases/update-transcript.use-case';
import { DeleteTranscriptUseCase } from './use-cases/delete-transcript.use-case';
import { CreateTranscriptSchema } from './dto/create-transcript.dto';
import type { CreateTranscriptDto } from './dto/create-transcript.dto';
import { UpdateTranscriptSchema } from './dto/update-transcript.dto';
import type { UpdateTranscriptDto } from './dto/update-transcript.dto';
import type { Transcript } from './transcript.entity';

const TranscriptSearchSchema = z.object({
  opportunityId: z.string().uuid().optional(),
  source: z.enum(['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom']).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('transcripts')
export class TranscriptController {
  constructor(
    private readonly transcriptService: TranscriptService,
    private readonly findByIdUseCase: FindTranscriptByIdUseCase,
    private readonly listUseCase: ListTranscriptsUseCase,
    private readonly createUseCase: CreateTranscriptUseCase,
    private readonly updateUseCase: UpdateTranscriptUseCase,
    private readonly deleteUseCase: DeleteTranscriptUseCase,
  ) {}

  @ApiOperation({ summary: 'Search transcripts', operationId: 'searchTranscripts' })
  @ApiQuery({ name: 'opportunityId', required: false, type: String, format: 'uuid', description: 'Filter to transcripts belonging to a specific deal', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiQuery({ name: 'source', required: false, enum: ['zoom', 'google_meet', 'manual', 'gong', 'granola', 'fathom'], description: 'Filter by the meeting platform the transcript came from', example: 'zoom' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Full-text search across transcript content', example: 'security compliance' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results to return', example: 25 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of results to skip (for pagination)', example: 0 })
  @ApiResponse({ status: 200, description: 'Filtered transcript results — same shape as POST /search' })
  @Get('search')
  async search(@Query() query: Record<string, unknown>) {
    const parsed = TranscriptSearchSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { opportunityId, source, search, limit, offset } = parsed.data;

    const conditions: FilterExpression[] = [];
    if (opportunityId) conditions.push({ on: 'opportunityId', op: 'eq', value: opportunityId });
    if (source) conditions.push({ on: 'source', op: 'eq', value: source });
    if (search) conditions.push({ on: 'text', op: 'contains', value: search });

    const filter: FilterExpression | undefined =
      conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] :
      { and: conditions };

    return this.transcriptService.search({ filter, page: { limit, offset } }, { preview: true });
  }

  @ApiOperation({ summary: 'List transcripts', operationId: 'listTranscripts' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/TranscriptOutputDto' } },
  })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Get()
  async getAll(): Promise<Transcript[]> {
    return this.listUseCase.execute();
  }

  @ApiOperation({ summary: 'Find transcript by id', operationId: 'findTranscriptById' })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/TranscriptOutputDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<Transcript> {
    // Use case throws NotFoundException on null/undefined (D2)
    return this.findByIdUseCase.execute(id);
  }


  @ApiOperation({ summary: 'Create transcript', operationId: 'createTranscript' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateTranscriptDto' } })
  @ApiResponse({ status: 201, schema: { $ref: '#/components/schemas/TranscriptOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateTranscriptSchema)) dto: CreateTranscriptDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Transcript> {
    return this.createUseCase.execute(dto, { actor: { tenantId, userId } });
  }

  @ApiOperation({ summary: 'Update transcript', operationId: 'updateTranscript' })
  @ApiBody({ schema: { $ref: '#/components/schemas/UpdateTranscriptDto' } })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/TranscriptOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTranscriptSchema)) dto: UpdateTranscriptDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Transcript> {
    const entity = await this.updateUseCase.execute(id, dto, { actor: { tenantId, userId } });
    if (!entity) throw new NotFoundException(`Transcript ${id} not found`);
    return entity;
  }

  @ApiOperation({ summary: 'Delete transcript', operationId: 'deleteTranscript' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<void> {
    return this.deleteUseCase.execute(id, { actor: { tenantId, userId } });
  }

}
