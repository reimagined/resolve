export default [
  {
    name: 'Todo',
    commands: {
      createList: (_, { payload: { title } }) => ({
        type: 'LIST_CREATED',
        payload: { title }
      }),
      removeList: () => ({
        type: 'LIST_REMOVED'
      }),
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
