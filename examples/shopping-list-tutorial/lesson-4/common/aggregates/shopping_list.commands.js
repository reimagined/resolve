import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

export default {
  createShoppingList: (state, { payload: { name } }) => {
    if (state.createdAt) throw new Error('the shopping list already exists')
    if (!name) throw new Error('name is required')
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name },
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
      payload: { id, text },
    }
  },
}
