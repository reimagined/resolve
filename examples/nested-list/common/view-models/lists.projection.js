export default {
  Init: () => [],
  LIST_CREATED: (state, { aggregateId, payload: { title } }) => [
    ...state,
    {
      id: aggregateId,
      title
    }
  ],
  LIST_REMOVED: (state, { aggregateId }) =>
    state.filter(({ id }) => id !== aggregateId)
}
