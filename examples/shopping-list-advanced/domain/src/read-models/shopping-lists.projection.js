import {
  USER_CREATED,
  USER_NAME_UPDATED,
  SHOPPING_LIST_CREATED,
  SHOPPING_LIST_RENAMED,
  SHOPPING_LIST_SHARED,
  SHOPPING_LIST_UNSHARED,
  SHOPPING_LIST_REMOVED
} from '../event-types'

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
      fields: ['createdAt', 'name']
    })

    await store.defineTable('Sharings', {
      indexes: {
        id: 'string',
        shoppingListId: 'string',
        userId: 'string'
      },
      fields: []
    })
  },

  [USER_CREATED]: async (
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

  [USER_NAME_UPDATED]: async (
    store,
    { aggregateId, payload: { username } }
  ) => {
    await store.update(
      'Users',
      { id: aggregateId },
      { $set: { username: username.trim() } }
    )
  },

  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name, userId } }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp,
      createdBy: userId
    }

    await store.insert('ShoppingLists', shoppingList)
    await store.insert('Sharings', {
      id: `${aggregateId}-${userId}`,
      shoppingListId: aggregateId,
      userId
    })
  },

  [SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
    await store.delete('ShoppingLists', { id: aggregateId })
    await store.delete('Sharings', { shoppingListId: aggregateId })
  },

  [SHOPPING_LIST_RENAMED]: async (
    store,
    { aggregateId, payload: { name } }
  ) => {
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { name } })
  },

  [SHOPPING_LIST_SHARED]: async (
    store,
    { aggregateId, payload: { userId } }
  ) => {
    const record = await store.findOne('Sharings', {
      shoppingListId: aggregateId,
      userId
    })

    if (!record) {
      await store.insert('Sharings', {
        id: `${aggregateId}-${userId}`,
        shoppingListId: aggregateId,
        userId
      })
    }
  },

  [SHOPPING_LIST_UNSHARED]: async (
    store,
    { aggregateId, payload: { userId } }
  ) => {
    const record = await store.findOne('Sharings', {
      shoppingListId: aggregateId,
      userId
    })

    if (record) {
      await store.delete('Sharings', { shoppingListId: aggregateId, userId })
    }
  }
}
