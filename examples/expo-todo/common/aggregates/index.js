export default [
  {
    name: 'Todo',
    commands: {
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
  }
]
