import { AggregateProjection } from '@resolve-js/core'
import {
  ENTITY_CREATED,
  ENTITY_DELETED,
  ENTITY_ITEM_ADDED,
  ENTITY_ITEM_REMOVED,
} from '../event-types'

const projection: AggregateProjection = {
  Init: () => ({
    exists: false,
  }),
  [ENTITY_CREATED]: (state) => ({
    ...state,
    exists: true,
    items: [],
  }),
  [ENTITY_DELETED]: (state) => ({
    ...state,
    exists: false,
  }),
  [ENTITY_ITEM_ADDED]: (state, { payload }) => ({
    ...state,
    items: [...state.items, payload.itemName],
  }),
  [ENTITY_ITEM_REMOVED]: (state, { payload }) => ({
    ...state,
    items: state.items.filter((item) => item !== payload.itemName),
  }),
}

export default projection
