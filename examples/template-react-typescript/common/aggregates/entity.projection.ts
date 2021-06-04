import {
  ENTITY_CREATED,
  ENTITY_DELETED,
  ENTITY_ITEM_ADDED,
  ENTITY_ITEM_REMOVED,
} from '../event-types'

export default {
  Init: () => ({}),
  [ENTITY_CREATED]: (state, { timestamp, payload: { name } }) => ({
    ...state,
    name,
    items: [],
    createdAt: timestamp,
  }),
  [ENTITY_DELETED]: () => ({}),
  [ENTITY_ITEM_ADDED]: (state, { payload }) => ({
    ...state,
    items: [...state.items, payload.itemName],
  }),
  [ENTITY_ITEM_REMOVED]: (state, { payload }) => ({
    ...state,
    items: state.items.filter((item) => item !== payload.itemName),
  }),
}
