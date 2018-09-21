export default {
  all: async store => {
    return await store.find('ShoppingLists', {})
  }
}
