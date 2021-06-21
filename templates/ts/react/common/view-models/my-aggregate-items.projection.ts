import { ViewModelProjection } from '@resolve-js/core'
import {
  MY_AGGREGATE_ITEM_ADDED,
  MY_AGGREGATE_ITEM_REMOVED,
} from '../event-types'

const projection: ViewModelProjection<string[]> = {
  Init: () => [],
  [MY_AGGREGATE_ITEM_ADDED]: (state, { payload: { itemName } }) => [
    ...state,
    itemName,
  ],
  [MY_AGGREGATE_ITEM_REMOVED]: (state, { payload: { itemName } }) =>
    state.filter((item) => item !== itemName),
}

export default projection
