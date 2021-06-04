import { ViewModelProjection } from '@resolve-js/core'
import { ENTITY_ITEM_ADDED, ENTITY_ITEM_REMOVED } from '../event-types'

type EntityState = {
  items: string[]
}

const projection: ViewModelProjection<EntityState> = {
  Init: () => ({
    items: [],
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

export default projection
