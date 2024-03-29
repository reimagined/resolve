const resolvers = {
  // The 'all' resolver returns all entries from the 'ShoppingLists' table.
  all: async (store) => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  },
}

export default resolvers
