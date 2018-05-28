export default {
  createList: (state, { payload: { title } }) => ({
    type: 'LIST_CREATED',
    payload: { title }
  }),
  removeList: () => ({
    type: 'LIST_REMOVED'
  }),
  createItem: (state, { payload: { id, text } }) => ({
    type: 'ITEM_CREATED',
    payload: { id, text }
  }),
  toggleItem: (state, { payload: { id } }) => ({
    type: 'ITEM_TOGGLED',
    payload: { id }
  }),
  removeItem: (state, { payload: { id } }) => ({
    type: 'ITEM_REMOVED',
    payload: { id }
  })
}