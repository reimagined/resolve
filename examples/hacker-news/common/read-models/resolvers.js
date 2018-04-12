import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwtSecret'

const getMe = async jwtToken => {
  if (!jwtToken) return null
  const user = await jwt.verify(jwtToken, jwtSecret)

  if (!user.name) {
    return null
  }

  return user
}

const getStories = async (type, store, { first, offset, jwtToken }) => {
  const search = type && type.constructor === String ? { type } : {}
  const skip = first || 0
  const stories = await store.find(
    'Stories',
    search,
    null,
    { createdAt: -1 },
    skip,
    skip + offset
  )

  return {
    stories: Array.isArray(stories) ? stories : [],
    me: await getMe(jwtToken)
  }
}

export default {
  me: async (store, { jwtToken }) => await getMe(jwtToken),

  user: async (store, { id, name, jwtToken }) => {
    const user =
      name != null
        ? await store.findOne('Users', { name })
        : id != null ? await store.findOne('Users', { id }) : null

    return {
      user,
      me: await getMe(jwtToken)
    }
  },

  allStories: getStories.bind(null, null),

  askStories: getStories.bind(null, 'ask'),

  showStories: getStories.bind(null, 'show'),

  comments: async (store, { first, offset, jwtToken }) => {
    const skip = first || 0
    const comments = await store.find(
      'Comments',
      {},
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )

    return {
      comments: Array.isArray(comments) ? comments : [],
      me: await getMe(jwtToken)
    }
  },

  void: async () => null
}
