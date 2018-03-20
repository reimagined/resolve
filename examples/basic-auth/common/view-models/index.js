export default [
  {
    name: 'Likes',
    projection: {
      Init: () => [],
      LIKE: (state, { payload: { username } }) =>
        state.indexOf(username) !== -1
          ? state.filter(likedUsername => likedUsername !== username)
          : [...state, username]
    },
    serializeState: state => JSON.stringify(state),
    deserializeState: state => JSON.parse(state)
  }
]
