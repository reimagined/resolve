import {
  MY_AGGREGATE_CREATED,
  MY_AGGREGATE_DELETED,
  MY_AGGREGATE_ITEM_ADDED,
  MY_AGGREGATE_ITEM_REMOVED,
} from '../event-types'
const aggregate = {
  create: (state, { payload: { name } }) => {
    if (state.exists) {
      throw new Error('Aggregate already exists')
    }
    return {
      type: MY_AGGREGATE_CREATED,
      payload: { name },
    }
  },
  delete: (state) => {
    if (!state.exists) {
      throw new Error('Aggregate does not exist')
    }
    return {
      type: MY_AGGREGATE_DELETED,
    }
  },
  addItem: (state) => {
    if (!state.exists) {
      throw new Error('Aggregate does not exist')
    }
    return {
      type: MY_AGGREGATE_ITEM_ADDED,
      payload: { itemName: `Item ${state.items.length}` },
    }
  },
  removeItem: (state, { payload: { itemName } }) => {
    if (!state.exists) {
      throw new Error('Aggregate does not exist')
    }
    return {
      type: MY_AGGREGATE_ITEM_REMOVED,
      payload: { itemName },
    }
  },
}
export default aggregate
