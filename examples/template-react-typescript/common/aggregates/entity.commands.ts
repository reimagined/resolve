import { Aggregate } from '@resolve-js/core'
import {
  ENTITY_CREATED,
  ENTITY_DELETED,
  ENTITY_ITEM_ADDED,
  ENTITY_ITEM_REMOVED,
} from '../event-types'

const aggregate: Aggregate = {
  createEntity: (state, { payload: { name } }) => {
    if (state.exists) {
      throw new Error('Entity already exists')
    }
    return {
      type: ENTITY_CREATED,
      payload: { name },
    }
  },
  deleteEntity: (state) => {
    if (!state.exists) {
      throw new Error('Entity not exist')
    }
    return {
      type: ENTITY_DELETED,
    }
  },
  addItem: (state) => {
    if (!state.exists) {
      throw new Error('Entity not exist')
    }
    return {
      type: ENTITY_ITEM_ADDED,
      payload: { itemName: `Item ${state.items.length}` },
    }
  },
  removeItem: (state, { payload: { itemName } }) => {
    if (!state.exists) {
      throw new Error('Entity not exist')
    }
    return {
      type: ENTITY_ITEM_REMOVED,
      payload: { itemName },
    }
  },
}

export default aggregate
