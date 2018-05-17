export default {
  users: store => store.find('Users', {}),
  createdUsers: store => store.find('CreatedUsers', {}),
  createdUser: (store, { id }) => store.findOne('CreatedUsers', { id })
}
