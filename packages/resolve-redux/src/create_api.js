import { getRootBasedUrl } from './utils'

const createApi = ({
  apiId,
  origin,
  rootPath,
  subscribeUrl
}) => ({
  loadViewModelState,
  loadReadModelState,
  sendCommand,
  subscribeToTopic,
  unsubscribeFromTopic
})