export const viewModels = []
export const readModels = []
export const aggregates = []
export const aggregateActions = {}

export const rootPath = ''
export const staticPath = ''
export const origin = 'http://localhost:3000'
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
