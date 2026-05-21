import { Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FindOpportunityByIdUseCase } from './use-cases/find-opportunity-by-id.use-case';
import { ListOpportunitiesUseCase } from './use-cases/list-opportunities.use-case';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { CreateOpportunityUseCase } from './use-cases/create-opportunity.use-case';
import { UpdateOpportunityUseCase } from './use-cases/update-opportunity.use-case';
import { DeleteOpportunityUseCase } from './use-cases/delete-opportunity.use-case';
import { CreateOpportunitySchema } from './dto/create-opportunity.dto';
import type { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunitySchema } from './dto/update-opportunity.dto';
import type { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import type { Opportunity } from './opportunity.entity';

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunityController {
  constructor(
    // All routes go through use cases (ADR-003 — no controller → service shortcuts)
    private readonly findByIdUseCase: FindOpportunityByIdUseCase,
    private readonly listUseCase: ListOpportunitiesUseCase,
    private readonly createUseCase: CreateOpportunityUseCase,
    private readonly updateUseCase: UpdateOpportunityUseCase,
    private readonly deleteUseCase: DeleteOpportunityUseCase,
  ) {}

  @ApiOperation({ summary: 'List opportunities', operationId: 'listOpportunitys' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/OpportunityOutputDto' } },
  })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Get()
  async getAll(): Promise<Opportunity[]> {
    return this.listUseCase.execute();
  }

  @ApiOperation({ summary: 'Find opportunity by id', operationId: 'findOpportunityById' })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/OpportunityOutputDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<Opportunity> {
    // Use case throws NotFoundException on null/undefined (D2)
    return this.findByIdUseCase.execute(id);
  }


  @ApiOperation({ summary: 'Create opportunity', operationId: 'createOpportunity' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateOpportunityDto' } })
  @ApiResponse({ status: 201, schema: { $ref: '#/components/schemas/OpportunityOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateOpportunitySchema)) dto: CreateOpportunityDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Opportunity> {
    return this.createUseCase.execute(dto, { actor: { tenantId, userId } });
  }

  @ApiOperation({ summary: 'Update opportunity', operationId: 'updateOpportunity' })
  @ApiBody({ schema: { $ref: '#/components/schemas/UpdateOpportunityDto' } })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/OpportunityOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOpportunitySchema)) dto: UpdateOpportunityDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Opportunity> {
    const entity = await this.updateUseCase.execute(id, dto, { actor: { tenantId, userId } });
    if (!entity) throw new NotFoundException(`Opportunity ${id} not found`);
    return entity;
  }

  @ApiOperation({ summary: 'Delete opportunity', operationId: 'deleteOpportunity' })
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
