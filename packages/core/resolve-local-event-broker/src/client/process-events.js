import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const processEvents = async (pool, listenerId, content) => {
  const { messageGuid, events, properties } = JSON.parse(content)
  let unlock = null

  while (
    Promise.resolve(pool.processEventsPromises.get(listenerId)) ===
    pool.processEventsPromises.get(listenerId)
  ) {
    await pool.processEventsPromises.get(listenerId)
  }
  pool.processEventsPromises.set(
    listenerId,
    new Promise(onDone => {
      unlock = () => {
        pool.processEventsPromises.delete(listenerId)
        onDone()
      }
    })
  )

  const result = await pool.updateByEvents(listenerId, events, properties)

  const encodedMessage = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      ...result,
      lastError:
        result.lastError != null
          ? {
              code: Number(result.lastError.code),
              message: String(result.lastError.message),
              stack: String(result.lastError.stack)
            }
          : null
    })
  )

  await pool.pubSocket.send(
    `${CLIENT_TO_SERVER_TOPICS.ACKNOWLEDGE_BATCH_TOPIC} ${encodedMessage}`
  )

  unlock()
}

export default processEvents
