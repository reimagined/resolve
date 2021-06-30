import {
  MY_AGGREGATE_CREATED,
  MY_AGGREGATE_DELETED,
  MY_AGGREGATE_ITEM_ADDED,
  MY_AGGREGATE_ITEM_REMOVED,
} from '../event-types'
const projection = {
  Init: () => ({
    exists: false,
  }),
  [MY_AGGREGATE_CREATED]: (state) => ({
    ...state,
    exists: true,
    items: [],
  }),
  [MY_AGGREGATE_DELETED]: (state) => ({
    ...state,
    exists: false,
  }),
  [MY_AGGREGATE_ITEM_ADDED]: (state, { payload }) => ({
    ...state,
    items: [...state.items, payload.itemName],
  }),
  [MY_AGGREGATE_ITEM_REMOVED]: (state, { payload }) => ({
    ...state,
    items: state.items.filter((item) => item !== payload.itemName),
  }),
}
export default projection
