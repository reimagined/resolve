const resolvers = {
  find: async (store, args) => {
    const result = await store.find('test', args)

    return result
  },
  findOne: async (store, args) => {
    const result = await store.findOne('test', args)

    return result
  },
}

export default resolvers
