import { BadRequestException, Controller, Get, Post, Patch, Delete, Body, Headers, NotFoundException, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { PaginationSchema } from '@shared/http/pagination';
import type { FilterExpression } from '../../query/types';
import { EmailService } from './email.service';
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

const EmailSearchSchema = z.object({
  opportunityId: z.string().uuid().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  search: z.string().optional(),
}).merge(PaginationSchema);

// OPENAPI-3: decorators reference registered schemas by `$ref` because
// CLP DTOs are Zod-derived types (OPENAPI-2 registers them by name at
// onModuleInit). `ErrorResponseDto` is auto-registered by the shared
// registry.
@ApiBearerAuth()
@Controller('emails')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly findByIdUseCase: FindEmailByIdUseCase,
    private readonly listUseCase: ListEmailsUseCase,
    private readonly createUseCase: CreateEmailUseCase,
    private readonly updateUseCase: UpdateEmailUseCase,
    private readonly deleteUseCase: DeleteEmailUseCase,
  ) {}

  @ApiOperation({ summary: 'Search emails', operationId: 'searchEmails' })
  @ApiQuery({ name: 'opportunityId', required: false, type: String, format: 'uuid', description: 'Filter to emails belonging to a specific deal', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiQuery({ name: 'direction', required: false, enum: ['inbound', 'outbound'], description: 'Filter by email direction — inbound (received) or outbound (sent)', example: 'inbound' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Full-text search across email subject and body', example: 'pricing proposal' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results to return', example: 25 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of results to skip (for pagination)', example: 0 })
  @ApiResponse({ status: 200, description: 'Filtered email results' })
  @Get('search')
  async search(@Query() query: Record<string, unknown>) {
    const parsed = EmailSearchSchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { opportunityId, direction, search, limit, offset } = parsed.data;

    const conditions: FilterExpression[] = [];
    if (opportunityId) conditions.push({ on: 'opportunityId', op: 'eq', value: opportunityId });
    if (direction) conditions.push({ on: 'direction', op: 'eq', value: direction });
    if (search) conditions.push({ on: 'text', op: 'contains', value: search });

    const filter: FilterExpression | undefined =
      conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] :
      { and: conditions };

    return this.emailService.search({ filter, page: { limit, offset } }, { preview: true });
  }

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
