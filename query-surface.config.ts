// Dogfood config — points the query-surface CLI at this repo's demo schema, so
// `bun src/cli/index.ts doctor` / `describe` exercise the same path a consumer uses.
// A consumer scaffolds their own via `query-surface init`.
import * as schema from './src/schema';

export default {
  schema,
  // exclude: [],                       // extra tables to hide (EAV substrate auto-excluded)
  // names: {},                         // table -> exposed entity name
  // eav: {},                           // value-table overlay (see EavStrategy)
};
