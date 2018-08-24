export default {
  shoppingLists: async store => {
    return await store.find('ShoppingLists', {})
  }
}
