const emptySubscribeAdapter = () => ({
  async init() {},
  async subscribeToTopics() {},
  async unsubscribeFromTopics() {},
  async close() {},
  isConnected: () => true
})

export default emptySubscribeAdapter
