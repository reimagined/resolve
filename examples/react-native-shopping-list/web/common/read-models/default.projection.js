export default {
  Init: async store => {
    await store.defineTable('Users', {
      indexes: {
        id: 'string',
        username: 'string',
        passwordHash: 'string',
        accessTokenHash: 'string'
      },
      fields: ['createdAt']
    })

    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string',
        createdBy: 'string'
      },
      fields: ['createdAt', 'name', 'sharings']
    })
  },

  USER_CREATED: async (
    store,
    {
      aggregateId,
      timestamp,
      payload: { username, passwordHash = '', accessTokenHash = '' }
    }
  ) => {
    const user = {
      id: aggregateId,
      username: username.trim(),
      createdAt: timestamp,
      passwordHash,
      accessTokenHash
    }
    await store.insert('Users', user)
  },

  USER_NAME_UPDATED: async (store, { aggregateId, payload: { username } }) => {
    await store.update(
      'Users',
      { id: aggregateId },
      { $set: { username: username.trim() } }
    )
  },

  LIST_CREATED: async (
    store,
    { aggregateId, timestamp, payload: { name, userId } }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp,
      createdBy: userId,
      sharings: []
    }

    await store.insert('ShoppingLists', shoppingList)
  },

  LIST_RENAMED: async (store, { aggregateId, payload: { name } }) => {
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { name } })
  },
  
  SHOPPING_LIST_SHARED: async (store, { aggregateId, payload: { userId } }) => {
    const shoppingList = await store.findOne('ShoppingLists', { id: aggregateId })
    
    const sharings = [...shoppingList.sharings, userId]
    
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { sharings } })
  },
  
  SHOPPING_LIST_UNSHARED:  async (store, { aggregateId, payload: { userId } }) => {
    const shoppingList = await store.findOne('ShoppingLists', { id: aggregateId })
  
    const sharings = shoppingList.sharings.filter(
      (id) => id !== userId
    )
  
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { sharings } })
  }
}
