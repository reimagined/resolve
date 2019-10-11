const doUpdateRequest = async (pool, listenerId, eventTypes) => {
  await pool.declareListenerEventTypes(listenerId, eventTypes)
  const encodedTopic = pool.encodeXsubTopic({
    clientId: pool.instanceId,
    listenerId
  })

  return await pool.subSocket.subscribe(encodedTopic)
}

export default doUpdateRequest
