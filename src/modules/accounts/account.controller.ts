import { Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FindAccountByIdUseCase } from './use-cases/find-account-by-id.use-case';
import { ListAccountsUseCase } from './use-cases/list-accounts.use-case';
import { ZodValidationPipe } from '@shared/pipes/zod-validation.pipe';
import { CreateAccountUseCase } from './use-cases/create-account.use-case';
import { UpdateAccountUseCase } from './use-cases/update-account.use-case';
import { DeleteAccountUseCase } from './use-cases/delete-account.use-case';
import { CreateAccountSchema } from './dto/create-account.dto';
import type { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountSchema } from './dto/update-account.dto';
import type { UpdateAccountDto } from './dto/update-account.dto';
import type { Account } from './account.entity';

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('accounts')
export class AccountController {
  constructor(
    // All routes go through use cases (ADR-003 — no controller → service shortcuts)
    private readonly findByIdUseCase: FindAccountByIdUseCase,
    private readonly listUseCase: ListAccountsUseCase,
    private readonly createUseCase: CreateAccountUseCase,
    private readonly updateUseCase: UpdateAccountUseCase,
    private readonly deleteUseCase: DeleteAccountUseCase,
  ) {}

  @ApiOperation({ summary: 'List accounts', operationId: 'listAccounts' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { $ref: '#/components/schemas/AccountOutputDto' } },
  })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Get()
  async getAll(): Promise<Account[]> {
    return this.listUseCase.execute();
  }

  @ApiOperation({ summary: 'Find account by id', operationId: 'findAccountById' })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/AccountOutputDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<Account> {
    // Use case throws NotFoundException on null/undefined (D2)
    return this.findByIdUseCase.execute(id);
  }


  @ApiOperation({ summary: 'Create account', operationId: 'createAccount' })
  @ApiBody({ schema: { $ref: '#/components/schemas/CreateAccountDto' } })
  @ApiResponse({ status: 201, schema: { $ref: '#/components/schemas/AccountOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateAccountSchema)) dto: CreateAccountDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Account> {
    return this.createUseCase.execute(dto, { actor: { tenantId, userId } });
  }

  @ApiOperation({ summary: 'Update account', operationId: 'updateAccount' })
  @ApiBody({ schema: { $ref: '#/components/schemas/UpdateAccountDto' } })
  @ApiResponse({ status: 200, schema: { $ref: '#/components/schemas/AccountOutputDto' } })
  @ApiResponse({ status: 400, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiResponse({ status: 404, schema: { $ref: '#/components/schemas/ErrorResponseDto' } })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateAccountSchema)) dto: UpdateAccountDto,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Account> {
    const entity = await this.updateUseCase.execute(id, dto, { actor: { tenantId, userId } });
    if (!entity) throw new NotFoundException(`Account ${id} not found`);
    return entity;
  }

  @ApiOperation({ summary: 'Delete account', operationId: 'deleteAccount' })
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
