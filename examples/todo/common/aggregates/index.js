export default [
  {
    name: 'Todo',
    commands: {
      createItem: (_, { payload: { id, text } }) => ({
        type: 'ITEM_CREATED',
        payload: { id, text }
      }),
      toggleItem: (_, { payload: { id } }) => ({
        type: 'ITEM_TOGGLED',
        payload: { id }
      }),
      removeItem: (_, { payload: { id } }) => ({
        type: 'ITEM_REMOVED',
        payload: { id }
      })
    }
  }
]
