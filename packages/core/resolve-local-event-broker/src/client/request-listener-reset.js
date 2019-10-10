import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const requestListenerReset = async (pool, listenerId, eventTypes) => {
  await pool.declareListenerEventTypes(listenerId, eventTypes)
  const messageGuid = pool.cuid()
  const promise = new Promise(resolvePromise => {
    pool.resetListenersPromises.set(messageGuid, resolvePromise)
  })

  const encodedMessage = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      clientId: pool.instanceId,
      listenerId
    })
  )

  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.RESET_LISTENER_TOPIC} ${encodedMessage}`
  )

  return await promise
}

export default requestListenerReset
