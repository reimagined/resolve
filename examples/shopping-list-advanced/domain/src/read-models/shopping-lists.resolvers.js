import jwt from 'jsonwebtoken'

import jwtSecret from '../auth/jwt-secret'

export default {
  sharings: async (store, { query, shoppingListId }, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    const shoppingList = await store.findOne('ShoppingLists', {
      id: shoppingListId
    })

    if (!shoppingList) {
      return null
    }

    let users = await store.find('Users', {}, null, { createdAt: -1 })

    users = Array.isArray(users) ? users : []

    users = users.filter(({ id }) => id !== userId)

    const sharings = (
      (await store.find('Sharings', { shoppingListId })) || []
    ).map(({ userId }) => userId)

    if (query !== '') {
      users = users.filter(({ username }) =>
        username.toLowerCase().includes(query.toLowerCase())
      )
    }
    return {
      id: shoppingList.id,
      name: shoppingList.name,
      users: {
        sharings: users.filter(({ id }) => sharings.includes(id)),
        other: users.filter(({ id }) => !sharings.includes(id))
      }
    }
  },

  user: async (
    store,
    { id, username, passwordHash = '', accessTokenHash = '' }
  ) => {
    let query = {}

    if (id) {
      query.id = id
    } else if (username && passwordHash) {
      query.$and = [{ username: username.trim() }, { passwordHash }]
    } else if (username) {
      query.username = username.trim()
    } else if (accessTokenHash) {
      query = { accessTokenHash }
    }

    return await store.findOne('Users', query)
  },

  all: async (store, _, jwtToken) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    const shoppingLists = []

    const sharings = await store.find('Sharings', { userId })
    for (const { shoppingListId } of sharings) {
      const shoppingList = await store.findOne('ShoppingLists', {
        id: shoppingListId
      })
      if (shoppingList) {
        shoppingLists.push(shoppingList)
      }
    }

    return shoppingLists
  }
}
