import jwt from 'jsonwebtoken'

export default {
  user: async (store, { id, name }) => {
    const user = id
      ? await store.find('Users', { id })
      : await store.find('Users', { name })

    return user.length > 0 ? user[0] : null
  },
  me: async (store, _, { jwtToken }) => {
    if (!jwtToken) {
      return null
    }
    const user = await jwt.verify(
      jwtToken,
      process.env.JWT_SECRET || 'DefaultSecret'
    )
    return user
  },
  stories: async (store, { type, first, offset }) => {
    const skip = first || 0
    const params = type ? { type } : {}
    const stories = await store.find(
      'Stories',
      params,
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )
    if (!stories) {
      return []
    }
    return stories
  },
  comments: async (store, { first, offset }) => {
    const skip = first || 0
    const comments = await store.find(
      'Comments',
      {},
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )
    if (!comments) {
      return []
    }
    return comments
  }
}
