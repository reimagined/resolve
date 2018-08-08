export default {
  createItem: (state, { payload: { id, text } }) => ({
    type: 'SHOPPING_ITEM_CREATED',
    payload: { id, text }
  }),
  toggleItem: (state, { payload: { id } }) => ({
    type: 'SHOPPING_ITEM_TOGGLED',
    payload: { id }
  }),
  removeItem: (state, { payload: { id } }) => ({
    type: 'SHOPPING_ITEM_REMOVED',
    payload: { id }
  })
}
