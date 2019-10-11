const onAcknowledgeBatchTopic = async (pool, content) => {
  const { listenerId, lastError, lastEvent, messageGuid } = JSON.parse(content)
  const status = lastError == null ? 'running' : 'pausedOnError'
  const resolver = pool.waitMessagePromises.get(messageGuid)
  pool.waitMessagePromises.delete(messageGuid)
  if (typeof resolver === 'function') {
    resolver({ listenerId, lastError, lastEvent })
  }

  try {
    await pool.updateListenerInfo(listenerId, {
      LastError: lastError,
      LastEvent: lastEvent,
      Status: status
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed write to bus database', error)
  }
}

export default onAcknowledgeBatchTopic
