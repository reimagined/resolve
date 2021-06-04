import {
  ENTITY_CREATED,
  ENTITY_DELETED,
  ENTITY_ITEM_ADDED,
  ENTITY_ITEM_REMOVED,
} from '../event-types'

export default {
  createEntity: (state, { payload: { name } }) => {
    if (state.createdAt) {
      throw new Error('Entity already exists')
    }
    return {
      type: ENTITY_CREATED,
      payload: { name },
    }
  },
  deleteEntity: (state) => {
    if (!state.createdAt) {
      throw new Error('Entity does not exist')
    }
    return {
      type: ENTITY_DELETED,
    }
  },
  addItem: (state) => {
    if (!state.createdAt) {
      throw new Error('Entity does not exist')
    }

    return {
      type: ENTITY_ITEM_ADDED,
      payload: { itemName: `Item ${state.items.length}` },
    }
  },
  removeItem: (state, { payload: { itemName } }) => {
    if (!state.createdAt) {
      throw new Error('Entity does not exist')
    }

    if (!itemName) {
      throw new Error(`The "itemName" field is required`)
    }

    if (!state.items.includes(itemName)) {
      throw new Error(`Item not found`)
    }

    return {
      type: ENTITY_ITEM_REMOVED,
      payload: { itemName },
    }
  },
}
