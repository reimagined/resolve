const resolvers = {
  read: async store => {
    return await store.get()
  }
}

export default resolvers
