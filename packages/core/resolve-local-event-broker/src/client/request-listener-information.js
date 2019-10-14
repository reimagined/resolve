import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const requestListenerInformation = async (pool, listenerId) => {
  const messageGuid = pool.cuid()
  const promise = new Promise(resolvePromise => {
    pool.informationTopicsPromises.set(messageGuid, resolvePromise)
  })

  const encodedMessage = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      clientId: pool.instanceId,
      listenerId
    })
  )

  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.INFORMATION_TOPIC} ${encodedMessage}`
  )

  const result = await promise
  const information =
    result != null && result.information != null ? result.information : {}

  return {
    listenerId,
    status: information.Status,
    lastEvent: information.LastEvent,
    lastError: information.LastError
  }
}

export default requestListenerInformation
