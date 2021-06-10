const resolvers = {
  all: async (store) => {
    return await store.find('Entities', {})
  },
}
export default resolvers
