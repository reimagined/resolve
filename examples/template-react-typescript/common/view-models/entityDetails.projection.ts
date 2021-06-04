import {
  ENTITY_CREATED,
  ENTITY_DELETED,
  ENTITY_ITEM_ADDED,
  ENTITY_ITEM_REMOVED,
} from '../event-types'

export default {
  Init: () => ({
    name: '',
    id: null,
    items: [],
  }),
  [ENTITY_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
    items: [],
  }),
  [ENTITY_DELETED]: () => ({
    removed: true,
  }),
  [ENTITY_ITEM_ADDED]: (state, { payload: { itemName } }) => ({
    ...state,
    items: [...state.items, itemName],
  }),
  [ENTITY_ITEM_REMOVED]: (state, { payload: { itemName } }) => ({
    ...state,
    items: state.items.filter((item) => item !== itemName),
  }),
}
