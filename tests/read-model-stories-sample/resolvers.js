// mdis-start
const resolvers = {
  // mdis-start findOne
  getStoryById: async (store, { id }) => {
    return await store.findOne('Stories', { id })
  },
  // mdis-stop findOne
  // mdis-start find
  getStoriesByIds: async (store, { ids }) => {
    return await store.find('Stories', {
      $or: ids.map(storyId => ({ id: { $eq: storyId } }))
    })
  },
  // mdis-stop find

  getStoriesByPage: async (store, { skip, limit, ascending = true }) => {
    return await store.find(
      'Stories',
      {},
      null,
      { id: ascending ? 1 : -1 },
      skip,
      skip + limit
    )
  },

  getStoriesWithRangedVersion: async (
    store,
    { minVersion, maxVersion, openRange = false }
  ) => {
    return await store.find('Stories', {
      $and: [
        { version: { [openRange ? '$gte' : '$gt']: minVersion } },
        { version: { [openRange ? '$lte' : '$lt']: maxVersion } }
      ]
    })
  },

  getStoryVersionById: async (store, { id }) => {
    const { version } = await store.findOne('Stories', { id }, { version: 1 })
    return version
  },
  // mdis-start count
  getCountStories: async store => {
    return await store.count('Stories', {})
  }
  // mdis-stop count
}

export default resolvers
// mdis-stop
