const emptySubscribeAdapter = () => ({
  async init() {},
  async close() {},
  isConnected: () => true
})

emptySubscribeAdapter.adapterName = 'empty'

export default emptySubscribeAdapter
