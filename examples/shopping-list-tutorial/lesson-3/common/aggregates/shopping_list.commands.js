import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from "../eventTypes";

export default {
  createShoppingList: (state, { payload: { name } }) => {
    if (state.createdAt) throw new Error("Shopping List already exists");
    if (!name) throw new Error("name is required");
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name }
    };
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    if (!text) throw new Error("name is required");
    if (!state || Object.keys(state).length === 0) {
      throw new Error(`shopping list does not exist`);
    }
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    };
  }
};
