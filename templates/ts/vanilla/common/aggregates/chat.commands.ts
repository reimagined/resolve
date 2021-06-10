export default {
  postMessage: (_, { payload }) => ({
    type: 'MESSAGE_POSTED',
    payload,
  }),
}
