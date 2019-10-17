import resolveChunk from '../dist/common/client/client-chunk'

import getOrigin from './get_origin'

const { subscribeAdapter: createSubscribeAdapter, rootPath } = resolveChunk

const initApplication = async api => {
  const subscribers = new Set()
  const attachSubscriber = fn => subscribers.add(fn)
  const detachSubscriber = fn => subscribers.delete(fn)

  const onEvent = event => subscribers.forEach(fn => fn(event))

  const { appId, url } = await api.getSubscribeAdapterOptions(
    createSubscribeAdapter.adapterName
  )
  const origin = getOrigin()

  const {
    init: initSubscribeAdapter,
    subscribeToTopics,
    unsubscribeFromTopics
  } = createSubscribeAdapter({
    appId,
    origin,
    rootPath,
    url,
    onEvent
  })

  await initSubscribeAdapter()

  return {
    subscribeToTopics,
    unsubscribeFromTopics,
    attachSubscriber,
    detachSubscriber
  }
}

export default initApplication
