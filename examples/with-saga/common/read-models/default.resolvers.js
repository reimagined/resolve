export default {
  default: store => store.find('Users', {}),
  users: store => store.find('Users', {}),
  createdUsers: store => store.find('CreatedUsers', {}),
  createdUser: (store, { id }) => store.findOne('CreatedUsers', { id })
}
