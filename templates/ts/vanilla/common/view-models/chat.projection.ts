export default {
  Init: () => [],
  MESSAGE_POSTED: (state, { payload: { userName, message } }) =>
    state.concat({
      userName,
      message,
    }),
}
