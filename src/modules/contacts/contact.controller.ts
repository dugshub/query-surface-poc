import { Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FindContactByIdUseCase } from './use-cases/find-contact-by-id.use-case';
import { ListContactsUseCase } from './use-cases/list-contacts.use-case';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { CreateContactUseCase } from './use-cases/create-contact.use-case';
import { UpdateContactUseCase } from './use-cases/update-contact.use-case';
import { DeleteContactUseCase } from './use-cases/delete-contact.use-case';
import { CreateContactSchema } from './dto/create-contact.dto';
import type { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactSchema } from './dto/update-contact.dto';
import type { UpdateContactDto } from './dto/update-contact.dto';
import type { Contact } from './contact.entity';

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('contacts')
export class ContactController {
  constructor(
    // All routes go through use cases (ADR-003 — no controller → service shortcuts)
    private readonly findByIdUseCase: FindContactByIdUseCase,
    private readonly listUseCase: ListContactsUseCase,
    private readonly createUseCase: CreateContactUseCase,
    private readonly updateUseCase: UpdateContactUseCase,
    private readonly deleteUseCase: DeleteContactUseCase,
  ) {}

  @ApiOperation({ summary: 'List contacts', operationId: 'listContacts' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/ContactOutputDto' } },
  })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Get()
  async getAll(): Promise<Contact[]> {
    return this.listUseCase.execute();
  }

  @ApiOperation({ summary: 'Find contact by id', operationId: 'findContactById' })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/ContactOutputDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<Contact> {
    // Use case throws NotFoundException on null/undefined (D2)
    return this.findByIdUseCase.execute(id);
  }


  @ApiOperation({ summary: 'Create contact', operationId: 'createContact' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateContactDto' } })
  @ApiResponse({ status: 201, schema: { $ref: '#/components/schemas/ContactOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateContactSchema)) dto: CreateContactDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Contact> {
    return this.createUseCase.execute(dto, { actor: { tenantId, userId } });
  }

  @ApiOperation({ summary: 'Update contact', operationId: 'updateContact' })
  @ApiBody({ schema: { $ref: '#/components/schemas/UpdateContactDto' } })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/ContactOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateContactSchema)) dto: UpdateContactDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Contact> {
    const entity = await this.updateUseCase.execute(id, dto, { actor: { tenantId, userId } });
    if (!entity) throw new NotFoundException(`Contact ${id} not found`);
    return entity;
  }

  @ApiOperation({ summary: 'Delete contact', operationId: 'deleteContact' })
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
