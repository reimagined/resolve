export default {
  Init: () => ({}),
  LIST_CREATED: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
    sharing: []
  }),
  SHOPPING_LIST_SHARED: (state, { payload: { userId } }) => ({
    ...state,
    sharing: [...state.sharing, userId]
  }),
  SHOPPING_LIST_UNSHARED: (state, { payload: { userId } }) => ({
    ...state,
    sharing: state.sharing.filter(id => id !== userId)
  })
}
