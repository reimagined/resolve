export default {
  Init: () => [],
  MESSAGE_POSTED: (state, { aggregateId: userName, payload: message }) =>
    state.concat({
      userName,
      message
    })
}
