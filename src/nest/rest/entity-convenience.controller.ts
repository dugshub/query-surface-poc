import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { InvalidQueryError, UnknownEntityError } from '../errors';
import { GetByIdUseCase, ListUseCase, SearchUseCase } from '../use-cases';
import {
  type EntityListQueryDto,
  type QuerySearchRequestDto,
  entityListQuerySchema,
  querySearchRequestSchema,
} from './query.dto';
import { QuerySurfaceAuthGuard } from './query-surface-auth.guard';
import { ZodValidationPipe } from './zod-validation.pipe';

const ENTITY_PARAM = {
  name: 'entity',
  type: 'string',
  description:
    'Curated entity name — see GET /query/describe for the set the host exposes.',
} as const;

const ERROR_REF = { $ref: '#/components/schemas/ErrorResponseDto' } as const;

/**
 * Entity-convenience routes (partner DX): plain GET list/by-id over the same
 * scoped primitives the generic /query surface uses — search for ids, fetch
 * for rows — so tenancy scope and EAV behavior are identical by construction.
 *
 * MUST register after QueryController in the module's controllers array:
 * `:entity/:id` would otherwise pattern-match `query/describe`.
 */
@Controller({ path: '', version: '1' })
@UseGuards(QuerySurfaceAuthGuard)
@ApiSecurity('api-key')
export class EntityConvenienceController {
  constructor(
    private readonly listUseCase: ListUseCase,
    private readonly getByIdUseCase: GetByIdUseCase,
    private readonly searchUseCase: SearchUseCase,
  ) {}

  @Post(':entity/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Search this entity (same contract as POST /query/{entity}, entity pinned by path)',
    operationId: 'entityQuery',
  })
  @ApiParam(ENTITY_PARAM)
  @ApiBody({ schema: { $ref: '#/components/schemas/QuerySearchRequestDto' } })
  @ApiResponse({
    status: 200,
    schema: { $ref: '#/components/schemas/QuerySearchResultDto' },
  })
  @ApiResponse({ status: 400, schema: ERROR_REF })
  @ApiResponse({ status: 401, schema: ERROR_REF })
  @ApiResponse({ status: 404, schema: ERROR_REF })
  async query(
    @Param('entity') entity: string,
    @Body(new ZodValidationPipe(querySearchRequestSchema))
    body: QuerySearchRequestDto,
  ) {
    // Identical semantics to the generic surface — same internal use-case,
    // so scope, EAV, errors, and the future attribution envelope can never
    // diverge between the two route shapes.
    return this.http(() => this.searchUseCase.execute(entity, body));
  }

  @Get(':entity')
  @ApiOperation({
    summary: 'List entity rows (paged)',
    operationId: 'entityList',
  })
  @ApiParam(ENTITY_PARAM)
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: '1-200, default 50' })
  @ApiQuery({ name: 'offset', required: false, type: 'number' })
  @ApiQuery({ name: 'sort', required: false, type: 'string', description: 'Column key to sort by' })
  @ApiQuery({ name: 'dir', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    schema: { $ref: '#/components/schemas/EntityListResponseDto' },
  })
  @ApiResponse({ status: 400, schema: ERROR_REF })
  @ApiResponse({ status: 401, schema: ERROR_REF })
  @ApiResponse({ status: 404, schema: ERROR_REF })
  async list(
    @Param('entity') entity: string,
    @Query(new ZodValidationPipe(entityListQuerySchema))
    query: EntityListQueryDto,
  ) {
    return this.http(() =>
      this.listUseCase.execute(
        entity,
        { limit: query.limit ?? 50, offset: query.offset ?? 0 },
        query.sort ? { field: query.sort, dir: query.dir ?? 'asc' } : undefined,
      ),
    );
  }

  @Get(':entity/:id')
  @ApiOperation({
    summary: 'Get one entity row by id',
    operationId: 'entityGetById',
  })
  @ApiParam(ENTITY_PARAM)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { type: 'object' } })
  @ApiResponse({ status: 400, schema: ERROR_REF })
  @ApiResponse({ status: 401, schema: ERROR_REF })
  @ApiResponse({ status: 404, schema: ERROR_REF })
  async getById(
    @Param('entity') entity: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const row = await this.http(() => this.getByIdUseCase.execute(entity, id));
    if (!row) {
      // Out-of-scope and nonexistent are indistinguishable on purpose.
      throw new NotFoundException(`${entity} ${id} not found`);
    }
    return row;
  }

  /** REST's half of the error contract: typed package errors → HTTP. */
  private async http<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof UnknownEntityError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof InvalidQueryError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
