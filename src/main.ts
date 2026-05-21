import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { parse as parseYaml } from 'yaml';
import { AppModule } from './app.module';
import { OPENAPI_REGISTRY, OpenApiRegistry } from './shared/openapi';

interface OpenApiConfig {
  enabled?: boolean;
  path?: string;
  title?: string;
  version?: string;
  description?: string;
  auth?: 'bearer' | 'none';
}

interface CodegenConfig {
  openapi?: OpenApiConfig;
}

/**
 * Load `codegen.config.yaml` to pick up the `openapi:` block. Missing or
 * malformed → no config (Swagger disabled). The registry is the source of
 * truth for the document content; this just toggles whether Swagger UI
 * mounts + which metadata the header shows.
 */
function loadConfig(): CodegenConfig {
  const configPath = path.resolve(process.cwd(), 'codegen.config.yaml');
  if (!fs.existsSync(configPath)) return {};
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = parseYaml(raw);
    return (parsed && typeof parsed === 'object' ? parsed : {}) as CodegenConfig;
  } catch {
    return {};
  }
}

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  if (config.openapi?.enabled) {
    // OPENAPI-4: build the document in two passes.
    //
    //   1. Our vendored `OpenApiRegistry` owns the component schemas
    //      (Zod-derived DTOs registered by every generated module at
    //      onModuleInit — OPENAPI-2).
    //   2. `SwaggerModule.createDocument` scans controller decorators
    //      (@Api* — OPENAPI-3) and produces the `paths` map. Our
    //      schemas then get merged into the `components.schemas` it
    //      emits by reference.
    //
    // Both passes are needed: Nest's scanner is the source of truth for
    // paths (it knows the routes); the registry is the source of truth
    // for schemas (Zod can't be inferred from reflection metadata).
    const registry = app.get<OpenApiRegistry>(OPENAPI_REGISTRY);
    const registryDocument = await registry.build({
      title: config.openapi.title ?? 'API',
      version: config.openapi.version ?? '0.0.0',
      description: config.openapi.description,
    });

    const docBuilder = new DocumentBuilder()
      .setTitle(config.openapi.title ?? 'API')
      .setVersion(config.openapi.version ?? '0.0.0');
    if (config.openapi.description) docBuilder.setDescription(config.openapi.description);
    if ((config.openapi.auth ?? 'bearer') === 'bearer') docBuilder.addBearerAuth();

    const nestDocument = SwaggerModule.createDocument(app, docBuilder.build());

    // Merge registry-owned component schemas on top of whatever Nest's
    // decorator scanner produced. Controllers reference schemas by
    // `$ref` (OPENAPI-3), so this merge is what actually resolves the
    // refs consumers see in /docs-json.
    // Registry schemas are typed Record<string, unknown> locally
    // (avoids depending on openapi3-ts); the runtime shape matches Nest's
    // SchemaObject — generateSchema(zodRef, false, '3.0') emits valid
    // OpenAPI 3.0 schema objects. Cast to satisfy Nest's stricter typing.
    nestDocument.components = {
      ...nestDocument.components,
      schemas: {
        ...(nestDocument.components?.schemas ?? {}),
        ...registryDocument.components.schemas,
      } as NonNullable<typeof nestDocument.components>['schemas'],
    };

    SwaggerModule.setup(config.openapi.path ?? '/docs', app, nestDocument);
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Application listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', err);
  process.exit(1);
});
