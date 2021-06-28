import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

const aggregate = {
  createShoppingList: (state, { payload: { name } }) => {
    if (!name) throw new Error('The "name" field is required')
    if (state.createdAt) throw new Error('Shopping list already exists')
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name },
    }
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    if (!id) throw new Error('The "id" field is required')
    if (!text) throw new Error('The "text" field is required')
    if (!state || !state.createdAt) {
      throw new Error('Shopping list does not exist')
    }
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text },
    }
  },
}

export default aggregate
