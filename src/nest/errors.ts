/**
 * Typed errors for the external call path. The internal use-cases translate
 * the engine's plain Errors (stable message prefixes) into these; each
 * protocol presentation maps them to its own vocabulary (REST → 404/400,
 * future MCP → tool-error content). Exported so host exception filters can
 * recognize them; the use-cases that THROW them stay package-internal.
 */

export class UnknownEntityError extends Error {
  override readonly name = 'UnknownEntityError';
  constructor(public readonly entity: string) {
    super(`Unknown entity: ${entity}`);
  }
}

export class InvalidQueryError extends Error {
  override readonly name = 'InvalidQueryError';
}

/**
 * Run an engine call, rethrowing caller-input problems as typed errors.
 * Anything unrecognized propagates untouched (real failures stay loud).
 */
export async function translateEngineErrors<T>(
  fn: () => Promise<T> | T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('Unknown entity:')) {
        throw new UnknownEntityError(error.message.replace('Unknown entity: ', ''));
      }
      if (
        /^(Field path|Expand path|Expand depth)/.test(error.message) ||
        error.message.includes('not supported in path')
      ) {
        throw new InvalidQueryError(error.message);
      }
    }
    throw error;
  }
}
