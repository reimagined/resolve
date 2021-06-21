const resolvers = {
  all: async (store) => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  },
}
export default resolvers
