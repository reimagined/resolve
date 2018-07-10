export default {
  default: async (store, { timestamp }) => {
    const [users, errors] = await Promise.all([
      store.find('Users', {}, null, { timestamp: -1 }),
      store.find('Errors', { timestamp: { $gt: timestamp } }, null, {
        timestamp: 1
      })
    ])

    return {
      users,
      errors
    }
  },
  users: store => store.find('Users', {}),
  createdUsers: store => store.find('CreatedUsers', {}),
  createdUser: (store, { id }) => store.findOne('CreatedUsers', { id })
}
