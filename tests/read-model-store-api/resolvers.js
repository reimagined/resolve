const resolvers = {
  find: async (store, args) => {
    const result = await store.find('test', args)

    return result
  },
  findOne: async (store, args) => {
    const result = await store.findOne('test', args)

    return result
  },
  count: async (store, args) => {
    const result = await store.count('test', args)

    return result
  },
  findOneWithProjection: async (store, { projection, ...args }) => {
    const result = await store.findOne('test', args, projection)

    return result
  },
}

export default resolvers
