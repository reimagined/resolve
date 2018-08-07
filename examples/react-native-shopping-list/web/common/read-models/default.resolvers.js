import jwt from 'jsonwebtoken'

import jwtSecret from '../../auth/jwtSecret'

export default {
  users: async (store, { query, jwtToken }) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    let users = await store.find('Users', {}, null, { createdAt: -1 })

    users = Array.isArray(users) ? users : []

    if (query) {
      users = users.filter(({ username }) =>
        username.toLowerCase().includes(query.toLowerCase())
      )
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
      query.$and = [
        { username: username.toLowerCase().trim() },
        { passwordHash }
      ]
    } else if (username) {
      query.username = username.toLowerCase().trim()
    } else if (accessTokenHash) {
      query = { accessTokenHash }
    }

    return await store.findOne('Users', query)
  },

  shoppingLists: async (store, { jwtToken }) => {
    const { id: userId } = jwt.verify(jwtToken, jwtSecret)

    const shoppingLists = await store.find(
      'ShoppingLists',
      { createdBy: userId },
      null,
      {
        createdAt: 1
      }
    )

    return Array.isArray(shoppingLists) ? shoppingLists : []
  }
}
