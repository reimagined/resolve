import { Aggregate } from '@resolve-js/core'
import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED,
} from '../event-types'

const aggregate: Aggregate = {
  createShoppingList: (state, { payload: { name } }) => {
    if (state.createdAt) {
      throw new Error('Shopping List already exists')
    }
    if (!name) {
      throw new Error(`The "name" field is required`)
    }

    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name },
    }
  },
  renameShoppingList: (state, { payload: { name } }) => {
    if (!state.createdAt) {
      throw new Error('Shopping List does not exist')
    }

    if (!name) {
      throw new Error(`The "name" field is required`)
    }

    return {
      type: SHOPPING_LIST_RENAMED,
      payload: { name },
    }
  },
  removeShoppingList: (state) => {
    if (!state.createdAt) {
      throw new Error('Shopping List does not exist')
    }

    return {
      type: SHOPPING_LIST_REMOVED,
    }
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    if (!state.createdAt) {
      throw new Error('Shopping List does not exist')
    }

    if (!id) {
      throw new Error(`The "id" field is required`)
    }
    if (!text) {
      throw new Error(`The "text" field is required`)
    }

    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text },
    }
  },
  toggleShoppingItem: (state, { payload: { id } }) => {
    if (!state.createdAt) {
      throw new Error('Shopping List does not exist')
    }

    if (!id) {
      throw new Error(`The "id" field is required`)
    }

    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id },
    }
  },
  removeShoppingItem: (state, { payload: { id } }) => {
    if (!state.createdAt) {
      throw new Error('Shopping List does not exist')
    }

    if (!id) {
      throw new Error(`The "id" field is required`)
    }

    return {
      type: SHOPPING_ITEM_REMOVED,
      payload: { id },
    }
  },
}

export default aggregate
