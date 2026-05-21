import { Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FindEmailByIdUseCase } from './use-cases/find-email-by-id.use-case';
import { ListEmailsUseCase } from './use-cases/list-emails.use-case';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { CreateEmailUseCase } from './use-cases/create-email.use-case';
import { UpdateEmailUseCase } from './use-cases/update-email.use-case';
import { DeleteEmailUseCase } from './use-cases/delete-email.use-case';
import { CreateEmailSchema } from './dto/create-email.dto';
import type { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailSchema } from './dto/update-email.dto';
import type { UpdateEmailDto } from './dto/update-email.dto';
import type { Email } from './email.entity';

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('emails')
export class EmailController {
  constructor(
    // All routes go through use cases (ADR-003 — no controller → service shortcuts)
    private readonly findByIdUseCase: FindEmailByIdUseCase,
    private readonly listUseCase: ListEmailsUseCase,
    private readonly createUseCase: CreateEmailUseCase,
    private readonly updateUseCase: UpdateEmailUseCase,
    private readonly deleteUseCase: DeleteEmailUseCase,
  ) {}

  @ApiOperation({ summary: 'List emails', operationId: 'listEmails' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/EmailOutputDto' } },
  })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Get()
  async getAll(): Promise<Email[]> {
    return this.listUseCase.execute();
  }

  @ApiOperation({ summary: 'Find email by id', operationId: 'findEmailById' })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/EmailOutputDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<Email> {
    // Use case throws NotFoundException on null/undefined (D2)
    return this.findByIdUseCase.execute(id);
  }


  @ApiOperation({ summary: 'Create email', operationId: 'createEmail' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateEmailDto' } })
  @ApiResponse({ status: 201, schema: { $ref: '#/components/schemas/EmailOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateEmailSchema)) dto: CreateEmailDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Email> {
    return this.createUseCase.execute(dto, { actor: { tenantId, userId } });
  }

  @ApiOperation({ summary: 'Update email', operationId: 'updateEmail' })
  @ApiBody({ schema: { $ref: '#/components/schemas/UpdateEmailDto' } })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/EmailOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateEmailSchema)) dto: UpdateEmailDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Email> {
    const entity = await this.updateUseCase.execute(id, dto, { actor: { tenantId, userId } });
    if (!entity) throw new NotFoundException(`Email ${id} not found`);
    return entity;
  }

  @ApiOperation({ summary: 'Delete email', operationId: 'deleteEmail' })
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
