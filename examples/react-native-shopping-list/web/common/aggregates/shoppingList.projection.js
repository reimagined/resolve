export default {
  Init: () => ({}),
  LIST_CREATED: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp
  })
}
