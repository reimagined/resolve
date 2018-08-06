const getStories = async (type, store, { first, offset }) => {
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

  return Array.isArray(stories) ? stories : []
}

export default {
  user: async (store, { id, name }) => {
    const user =
      name != null
        ? await store.findOne('Users', { name })
        : id != null
          ? await store.findOne('Users', { id })
          : null

    return user
  },

  allStories: getStories.bind(null, null),

  askStories: getStories.bind(null, 'ask'),

  showStories: getStories.bind(null, 'show'),

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

    return Array.isArray(comments) ? comments : []
  }
}
