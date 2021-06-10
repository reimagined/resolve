import { ViewModelProjection } from '@resolve-js/core'
import { ENTITY_ITEM_ADDED, ENTITY_ITEM_REMOVED } from '../event-types'

const projection: ViewModelProjection<string[]> = {
  Init: () => [],
  [ENTITY_ITEM_ADDED]: (state, { payload: { itemName } }) => [
    ...state,
    itemName,
  ],
  [ENTITY_ITEM_REMOVED]: (state, { payload: { itemName } }) =>
    state.filter((item) => item !== itemName),
}

export default projection
