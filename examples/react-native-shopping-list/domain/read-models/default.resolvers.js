import jwt from 'jsonwebtoken'

import jwtSecret from '../../auth/jwtSecret'

export default {
  users: async (store, { query, shareId, jwtToken }) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    let users = await store.find('Users', {}, null, { createdAt: -1 })

    users = Array.isArray(users) ? users : []

    if (shareId) {
      const sharings = (
        (await store.find('Sharings', { shoppingListId: shareId })) || []
      ).map(({ userId }) => userId)

      if (query !== undefined) {
        if (query !== '') {
          users = users.filter(({ username }) =>
            username.toLowerCase().includes(query.toLowerCase())
          )
        }
        users = users.filter(({ id }) => !sharings.includes(id))
      } else {
        users = users.filter(({ id }) => sharings.includes(id))
      }
    }
    users = users.filter(({ id }) => id !== userId)

    return users
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

  shoppingLists: async (store, { jwtToken }) => {
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
