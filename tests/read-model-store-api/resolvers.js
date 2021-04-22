const resolvers = {
  all: async (store) => {
    const result = await store.find('test', {})

    return result
  },
}

export default resolvers
