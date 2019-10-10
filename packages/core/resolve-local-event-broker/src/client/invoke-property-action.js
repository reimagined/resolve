import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const invokePropertyAction = async (pool, action, listenerId, key, value) => {
  const messageGuid = pool.cuid()
  const promise = new Promise(resolvePromise => {
    pool.propertiesTopicsPromises.set(messageGuid, resolvePromise)
  })

  const encodedMessage = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      clientId: pool.instanceId,
      listenerId,
      action,
      key,
      value
    })
  )

  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.PROPERTIES_TOPIC} ${encodedMessage}`
  )

  return await promise
}

export default invokePropertyAction
