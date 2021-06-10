const resolvers = {
  all: async (store) => {
    return await store.find('Notes', {})
  },
}
export default resolvers
