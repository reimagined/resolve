export default {
  userActions: async (store, { userId }) => {
    return await store.findOne('UserActions', { userId })
  }
}
