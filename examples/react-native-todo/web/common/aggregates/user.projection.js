export default {
  Init: () => ({}),
  USER_CREATED: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp
  })
}
