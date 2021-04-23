const resolvers = {
  all: async (store) => {
    const result = await store.find('test', {})

    return result
  },
  findOne: async (store, args) => {
    const result = await store.findOne('test', args)

    return result
  },
}

export default resolvers
