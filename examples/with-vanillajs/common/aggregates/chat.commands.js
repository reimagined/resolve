export default {
  postMessage: (_, { payload: message }) => ({
    type: 'MESSAGE_POSTED',
    payload: message
  })
}
