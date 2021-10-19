const projection = {
  Init: () => [],
  MESSAGE_POSTED: (state, { payload: { userName, message } }) =>
    state.concat({
      userName,
      message,
    }),
}
export default projection
