import { Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FindTranscriptChunkByIdUseCase } from './use-cases/find-transcript_chunk-by-id.use-case';
import { ListTranscriptChunksUseCase } from './use-cases/list-transcript_chunks.use-case';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { CreateTranscriptChunkUseCase } from './use-cases/create-transcript_chunk.use-case';
import { UpdateTranscriptChunkUseCase } from './use-cases/update-transcript_chunk.use-case';
import { DeleteTranscriptChunkUseCase } from './use-cases/delete-transcript_chunk.use-case';
import { CreateTranscriptChunkSchema } from './dto/create-transcript_chunk.dto';
import type { CreateTranscriptChunkDto } from './dto/create-transcript_chunk.dto';
import { UpdateTranscriptChunkSchema } from './dto/update-transcript_chunk.dto';
import type { UpdateTranscriptChunkDto } from './dto/update-transcript_chunk.dto';
import type { TranscriptChunk } from './transcript_chunk.entity';

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('transcript_chunks')
export class TranscriptChunkController {
  constructor(
    // All routes go through use cases (ADR-003 — no controller → service shortcuts)
    private readonly findByIdUseCase: FindTranscriptChunkByIdUseCase,
    private readonly listUseCase: ListTranscriptChunksUseCase,
    private readonly createUseCase: CreateTranscriptChunkUseCase,
    private readonly updateUseCase: UpdateTranscriptChunkUseCase,
    private readonly deleteUseCase: DeleteTranscriptChunkUseCase,
  ) {}

  @ApiOperation({ summary: 'List transcript_chunks', operationId: 'listTranscriptChunks' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/TranscriptChunkOutputDto' } },
  })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Get()
  async getAll(): Promise<TranscriptChunk[]> {
    return this.listUseCase.execute();
  }

  @ApiOperation({ summary: 'Find transcript_chunk by id', operationId: 'findTranscriptChunkById' })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/TranscriptChunkOutputDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<TranscriptChunk> {
    // Use case throws NotFoundException on null/undefined (D2)
    return this.findByIdUseCase.execute(id);
  }


  @ApiOperation({ summary: 'Create transcript_chunk', operationId: 'createTranscriptChunk' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateTranscriptChunkDto' } })
  @ApiResponse({ status: 201, schema: { $ref: '#/components/schemas/TranscriptChunkOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateTranscriptChunkSchema)) dto: CreateTranscriptChunkDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<TranscriptChunk> {
    return this.createUseCase.execute(dto, { actor: { tenantId, userId } });
  }

  @ApiOperation({ summary: 'Update transcript_chunk', operationId: 'updateTranscriptChunk' })
  @ApiBody({ schema: { $ref: '#/components/schemas/UpdateTranscriptChunkDto' } })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/TranscriptChunkOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTranscriptChunkSchema)) dto: UpdateTranscriptChunkDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<TranscriptChunk> {
    const entity = await this.updateUseCase.execute(id, dto, { actor: { tenantId, userId } });
    if (!entity) throw new NotFoundException(`TranscriptChunk ${id} not found`);
    return entity;
  }

  @ApiOperation({ summary: 'Delete transcript_chunk', operationId: 'deleteTranscriptChunk' })
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
