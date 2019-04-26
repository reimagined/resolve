import {
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_CREATED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED
} from '../event_types'

export default {
  createShoppingList: (state, { payload: { name } }) => {
    if (state.createdAt) throw new Error('the shopping list already exists')
    if (!name) throw new Error('name is required')
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name }
    }
  },

  renameShoppingList: (state, { payload: { name } }) => {
    if (!name) throw new Error('name is required')
    if (!state || !state.createdAt) {
      throw new Error(`the shopping list does not exist`)
    }
    return {
      type: SHOPPING_LIST_RENAMED,
      payload: { name }
    }
  },

  removeShoppingList: state => {
    if (!state || !state.createdAt) {
      throw new Error(`the shopping list does not exist`)
    }
    return {
      type: SHOPPING_LIST_REMOVED
    }
  },

  createShoppingItem: (state, { payload: { id, text } }) => {
    if (!id) throw new Error('id is required')
    if (!text) throw new Error('text is required')
    if (!state || !state.createdAt) {
      throw new Error(`the shopping list does not exist`)
    }
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    }
  },

  toggleShoppingItem: (state, { payload: { id } }) => {
    if (!state || !state.createdAt) {
      throw new Error(`the shopping list does not exist`)
    }
    if (!id) throw new Error('id is required')
    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id }
    }
  },

  removeShoppingItem: (state, { payload: { id } }) => {
    if (!state || !state.createdAt) {
      throw new Error(`the shopping list does not exist`)
    }
    if (!id) throw new Error('id is required')
    return {
      type: SHOPPING_ITEM_REMOVED,
      payload: { id }
    }
  }
}
