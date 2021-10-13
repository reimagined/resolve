import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

// This file exports an object that contains two command handlers.
export default {
  // A command handler receives the aggregate state and a command payload.
  // A payload can contain arbitrary data related to the command.
  // For example, the "createShoppingList" command's payload contains the shopping list's name.
  createShoppingList: (state, { payload: { name } }) => {
    if (!name) throw new Error('The "name" field is required')
    if (state.createdAt) throw new Error('Shopping list already exists')
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name },
    }
  },
  // The "createShoppingItem" command's payload contains an item's ID and display text.
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
