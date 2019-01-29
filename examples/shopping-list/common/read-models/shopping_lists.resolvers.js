export default {
  all: async store => {
    await store.waitEventCausalConsistency()
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  }
}
