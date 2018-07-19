import { server } from './server'
import pubsubManager from './pubsub_manager'
import getRootBasedUrl from './utils/get_root_based_url'

import { subscribeAdapter } from './resources'

const createSubscribeAdapter = subscribeAdapter.module

export default createSubscribeAdapter({
  pubsubManager,
  server,
  getRootBasedUrl,
  qos: 1,
  appId: 'resolve',
  ...subscribeAdapter.options
})
