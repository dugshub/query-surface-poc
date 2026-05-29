// Query-state reducer. The whole UI mutates this one object through these
// actions; growing rungs (boolean tree, sort headers, expand, URL sync) add
// actions here without changing consumers.
import { emptyQueryState, type FilterExpression, type QueryState, type Sort } from './types';

export type QueryAction =
  | { type: 'selectEntity'; entity: string }
  | { type: 'toggleColumn'; key: string }
  | { type: 'setColumns'; columns: string[] }
  | { type: 'setFilter'; filter: FilterExpression | undefined }
  | { type: 'setSort'; sort: Sort[] }
  | { type: 'setLimit'; limit: number }
  | { type: 'setOffset'; offset: number }
  | { type: 'hydrate'; state: QueryState }
  | { type: 'reset' };

export function queryReducer(state: QueryState, action: QueryAction): QueryState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'selectEntity':
      // Switching entity invalidates field-scoped choices (columns/filter/sort).
      return state.entity === action.entity ? state : emptyQueryState(action.entity);
    case 'toggleColumn': {
      const has = state.columns.includes(action.key);
      return {
        ...state,
        columns: has
          ? state.columns.filter((c) => c !== action.key)
          : [...state.columns, action.key],
      };
    }
    case 'setColumns':
      return { ...state, columns: action.columns };
    case 'setFilter':
      return { ...state, filter: action.filter, page: { ...state.page, offset: 0 } };
    case 'setSort':
      return { ...state, sort: action.sort, page: { ...state.page, offset: 0 } };
    case 'setLimit':
      return { ...state, page: { limit: action.limit, offset: 0 } };
    case 'setOffset':
      return { ...state, page: { ...state.page, offset: Math.max(0, action.offset) } };
    case 'reset':
      return emptyQueryState(state.entity);
    default:
      return state;
  }
}
