import { getRootBasedUrl } from './utils'

const createApi = ({ origin, rootPath }) => ({
  loadViewModelState() {},
  loadReadModelState() {},
  sendCommand() {},
  subscribeToTopic() {},
  unsubscribeFromTopic() {},
  getSubscribeAdapterOptions() {}
})
