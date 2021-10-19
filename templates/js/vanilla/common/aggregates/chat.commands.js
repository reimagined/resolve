const aggregate = {
  postMessage: (_, { payload }) => ({
    type: 'MESSAGE_POSTED',
    payload,
  }),
}
export default aggregate
