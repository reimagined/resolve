import { server } from './server'
import pubsubManager from './pubsub_manager'
import getRootBasedUrl from './utils/get_root_based_url'

import {
  subscribeAdapter as createSubscribeAdapter,
  rootPath
} from './assemblies'

export default createSubscribeAdapter({
  pubsubManager,
  server,
  getRootBasedUrl: getRootBasedUrl.bind(null, rootPath),
  qos: 1,
  appId: 'resolve'
})
