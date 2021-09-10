import { Aggregate } from '@resolve-js/core'
import {
  MY_AGGREGATE_CREATED,
  MY_AGGREGATE_DELETED,
  MY_AGGREGATE_ITEM_ADDED,
  MY_AGGREGATE_ITEM_REMOVED,
} from '../event-types'
import { MyAggregateState } from '../types'

const aggregate: Aggregate = {
  create: (state: MyAggregateState, { payload: { name } }) => {
    if (state.exists) {
      throw new Error('Aggregate already exists')
    }
    return {
      type: MY_AGGREGATE_CREATED,
      payload: { name },
    }
  },
  delete: (state: MyAggregateState) => {
    if (!state.exists) {
      throw new Error('Aggregate not exist')
    }
    return {
      type: MY_AGGREGATE_DELETED,
    }
  },
  addItem: (state: MyAggregateState) => {
    if (!state.exists) {
      throw new Error('Aggregate not exist')
    }
    return {
      type: MY_AGGREGATE_ITEM_ADDED,
      payload: { itemName: `Item ${state.items.length}` },
    }
  },
  removeItem: (state: MyAggregateState, { payload: { itemName } }) => {
    if (!state.exists) {
      throw new Error('Aggregate not exist')
    }
    return {
      type: MY_AGGREGATE_ITEM_REMOVED,
      payload: { itemName },
    }
  },
}

export default aggregate
