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
      username: username.toLowerCase().trim(),
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
      { $set: { username: username.toLowerCase().trim() } }
    )
  }
}
