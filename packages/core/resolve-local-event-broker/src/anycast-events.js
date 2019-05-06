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

  await promise
}

export default anycastEvents
