const emptySubscribeAdapter = () => ({
  init() {
    return Promise.resolve()
  },
  subscribeToTopics() {
    return Promise.resolve()
  },
  unsubscribeFromTopics() {
    return Promise.resolve()
  },
  close() {
    return Promise.resolve()
  },
  isConnected: (): boolean => true
})

emptySubscribeAdapter.adapterName = 'empty'

export default emptySubscribeAdapter
