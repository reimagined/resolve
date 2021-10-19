const resolvers = {
  all: async (store) => {
    return await store.find('Aggregates', {})
  },
}
export default resolvers
