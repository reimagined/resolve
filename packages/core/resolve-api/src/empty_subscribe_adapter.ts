export interface SubscribeAdapter {
  init: () => Promise<any>
  subscribeToTopics: () => Promise<any>
  unsubscribeFromTopics: () => Promise<any>
  close: () => Promise<any>
  isConnected: () => boolean
  adapterName?: string
}

export interface CreateSubscribeAdapter {
  create: (options: object) => SubscribeAdapter
  adapterName: string
}

const emptySubscribeAdapter = {
  adapterName: 'empty',
  create: (): SubscribeAdapter => ({
    init: (): Promise<any> => Promise.resolve(),
    subscribeToTopics: (): Promise<any> => Promise.resolve(),
    unsubscribeFromTopics: (): Promise<any> => Promise.resolve(),
    close: (): Promise<any> => Promise.resolve(),
    isConnected: (): boolean => true
  })
}

export default emptySubscribeAdapter
