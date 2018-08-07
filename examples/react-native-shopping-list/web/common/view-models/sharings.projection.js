export default {
  Init: () => [],
  SHOPPING_LIST_SHARED: (state, { payload: { userId } }) => [...state, userId],
  SHOPPING_LIST_UNSHARED: (state, { payload: { userId } }) =>
    state.filter(id => id !== userId)
}
