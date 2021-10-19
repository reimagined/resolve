import { AggregateProjection } from '@resolve-js/core'
import {
  MY_AGGREGATE_CREATED,
  MY_AGGREGATE_DELETED,
  MY_AGGREGATE_ITEM_ADDED,
  MY_AGGREGATE_ITEM_REMOVED,
} from '../event-types'
import { MyAggregateState } from '../types'

const projection: AggregateProjection = {
  Init: () => ({
    exists: false,
  }),
  [MY_AGGREGATE_CREATED]: (state: MyAggregateState) => ({
    ...state,
    exists: true,
    items: [],
  }),
  [MY_AGGREGATE_DELETED]: (state: MyAggregateState) => ({
    ...state,
    exists: false,
  }),
  [MY_AGGREGATE_ITEM_ADDED]: (state: MyAggregateState, { payload }) => ({
    ...state,
    items: [...state.items, payload.itemName],
  }),
  [MY_AGGREGATE_ITEM_REMOVED]: (state: MyAggregateState, { payload }) => ({
    ...state,
    items: state.items.filter((item) => item !== payload.itemName),
  }),
}

export default projection
