import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { GENERATED_MODULES } from './generated/modules';
import { OPENAPI_REGISTRY, OpenApiRegistry } from './shared/openapi';
import { QueryModule } from './query/query.module';

/**
 * OpenApiModule — @Global() wrapper around the OPENAPI_REGISTRY singleton.
 *
 * OPENAPI-4: every generated entity module `@Inject(OPENAPI_REGISTRY)` to
 * register its Zod DTOs at onModuleInit (OPENAPI-2). NestJS's DI scoping
 * means providers declared in AppModule are NOT automatically visible
 * inside imported feature modules — exports from AppModule only flow to
 * modules that explicitly import AppModule, which feature modules don't.
 * Making the provider module `@Global()` broadcasts the token to every
 * module in the application graph; each generated module picks it up
 * without needing to import anything extra.
 *
 * `useValue: new OpenApiRegistry()` locks the instance to one per
 * process. Never instantiate `new OpenApiRegistry()` elsewhere — a
 * forked registry forks the schema table and produces a partial
 * /docs-json at boot.
 */
@Global()
@Module({
  providers: [{ provide: OPENAPI_REGISTRY, useValue: new OpenApiRegistry() }],
  exports: [OPENAPI_REGISTRY],
})
class OpenApiModule {}

/**
 * AppModule — wires DatabaseModule (global) + the OpenApiModule (global)
 * + the GENERATED_MODULES barrel.
 *
 * DatabaseModule must come first — it provides the DRIZZLE token that every
 * generated repository depends on. OpenApiModule follows so the registry
 * is in the global injector before any generated module's onModuleInit
 * fires. main.ts reads the built registry at boot to produce the Swagger
 * document (OPENAPI-4).
 */
@Module({
  imports: [DatabaseModule, OpenApiModule, QueryModule, ...GENERATED_MODULES],
})
export class AppModule {}
