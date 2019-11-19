const emptySubscribeAdapter = () => ({
  async init() {},
  async subscribeToTopics() {},
  async unsubscribeFromTopics() {},
  async close() {},
  isConnected: () => true
})

emptySubscribeAdapter.adapterName = 'empty'

export default emptySubscribeAdapter
