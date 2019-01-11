export default {
  default: async store => {
    await store.waitEventCausalConsistency()
    return await store.find('Users', {})
  },
  users: async store => {
    await store.waitEventCausalConsistency()
    return await store.find('Users', {})
  },
  createdUsers: async store => {
    await store.waitEventCausalConsistency()
    return await store.find('CreatedUsers', {})
  },
  createdUser: async (store, { id }) => {
    await store.waitEventCausalConsistency()
    return await store.findOne('CreatedUsers', { id })
  }
}
