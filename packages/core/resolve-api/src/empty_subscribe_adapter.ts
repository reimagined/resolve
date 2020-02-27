export interface SubscribeAdapter {
  init: () => any
  subscribeToTopics: () => any
  unsubscribeFromTopics: () => any
  close: () => any
  isConnected: () => boolean
  adapterName?: string
}

export interface CreateSubscribeAdapter {
  (options: object): SubscribeAdapter
  adapterName: string
}

const emptySubscribeAdapter = (): SubscribeAdapter => ({
  async init() {},
  async subscribeToTopics() {},
  async unsubscribeFromTopics() {},
  async close() {},
  isConnected: () => true
})

emptySubscribeAdapter.adapterName = 'empty'

export default emptySubscribeAdapter
