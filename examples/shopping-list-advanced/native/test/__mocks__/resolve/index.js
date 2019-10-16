export const viewModels = []
export const readModels = []
export const aggregates = []

export const rootPath = ''
export const staticPath = ''
export const customConstants = {
  backend: {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 3000
  },
  remoteReduxDevTools: {
    hostname: '127.0.0.1',
    port: 19042
  }
}
export const port = '3000'
export const applicationName = 'react-native-shopping-list'

export const subscribeAdapter = {
  async init() {},
  async close() {},
  async subscribeToTopics() {},
  async unsubscribeFromTopics() {},
  isConnected() {
    return true
  }
}

export const jwtCookie = { name: 'jwt' }
