export default {
  users: async store => {
    const users = await store.find('Users', {}, null, { createdAt: -1 })

    return Array.isArray(users) ? users : []
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
  }
}
