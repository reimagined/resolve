const anycastEvents = async (pool, listenerId, events, properties) => {
  const clientId = pool.clientMap
    .get(listenerId)
    [Symbol.iterator]() // eslint-disable-line no-unexpected-multiline
    .next().value

  const encodedTopic = pool.encodeXpubTopic({ listenerId, clientId })
  const messageGuid = pool.cuid()

  const promise = new Promise(resolve =>
    pool.waitMessagePromises.set(messageGuid, resolve)
  )

  const encodedContent = pool.encodePubContent(
    JSON.stringify({
      messageGuid,
      properties,
      events
    })
  )

  await pool.xpubSocket.send(`${encodedTopic} ${encodedContent}`)

  let isDone = false

  const result = await Promise.race([
    (async () => {
      try {
        await promise
      } catch (err) {}

      isDone = true

      return true
    })(),

    (async () => {
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 100))
        const listenerSet = pool.clientMap.get(listenerId)

        if (listenerSet == null || !listenerSet.has(clientId)) {
          pool.waitMessagePromises.delete(messageGuid)
          return false
        }
      }

      return true
    })()
  ])

  return result
}

export default anycastEvents
