const resolvers = {
  all: async (store) => {
    return await store.find('Users', {})
  },
  profile: async (store, { userId }) => {
    const entry = await store.findOne('Users', { id: userId })

    if (entry != null) {
      const { profile } = entry
      return {
        userId,
        profile,
      }
    }
    return null
  },
}

export default resolvers
