/**
 * NestJS injection tokens
 *
 * Used with @Inject() decorator in concrete repository constructors.
 */

/**
 * Injection token for the Drizzle ORM database client.
 *
 * Usage in concrete repositories:
 * ```typescript
 * constructor(@Inject(DRIZZLE) db: DrizzleClient) { super(db); }
 * ```
 */
export const DRIZZLE = 'DRIZZLE' as const;

/**
 * Injection token for the event bus (IEventBus).
 *
 * Optional — only resolved when EventsModule.forRoot() is registered.
 * BaseService uses this with @Optional() to emit lifecycle events
 * without requiring the events subsystem to be installed.
 *
 * Usage in services/use cases:
 * ```typescript
 * @Optional() @Inject(EVENT_BUS) eventBus?: IEventBus
 * ```
 */
export const EVENT_BUS = 'EVENT_BUS' as const;

/**
 * Injection token for the FilterCompilerService — the dynamic query layer.
 *
 * Injected as a property (`@Optional() @Inject(FILTER_COMPILER)`) on
 * BaseRepository so every generated repository gets query()/search()/fetch()
 * for free without modifying its constructor signature.
 *
 * Optional because some test contexts construct repos directly without a
 * NestJS container; those contexts can still use findById / list / create
 * etc. but will throw if they call the dynamic-query methods.
 */
export const FILTER_COMPILER = 'FILTER_COMPILER' as const;
