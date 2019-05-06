import { READ_MODEL_STATUS, BATCH_STEP_RESULT } from './constants'

const followTopicBatchStep = async (pool, listenerId) => {
  if (!pool.clientMap.has(listenerId)) {
    return BATCH_STEP_RESULT.STOP
  }

  const listenerInfo = await pool.getListenerInfo(pool, listenerId)
  const properties = listenerInfo.properties

  if (listenerInfo.isFirstRun) {
    await pool.anycastEvents(pool, listenerId, [{ type: 'Init' }], properties)

    await pool.meta.updateListenerInfo(listenerId, {
      SkipCount: 0,
      AbutTimestamp: 0
    })
  }

  const events = []
  if (listenerInfo.status !== READ_MODEL_STATUS.running) {
    return BATCH_STEP_RESULT.STOP
  }

  await pool.eventStore.loadEvents(
    {
      startTime: listenerInfo.abutTimestamp,
      maxEvents: pool.config.batchSize
    },
    pool.adjustEventBatch.bind(null, listenerInfo, events)
  )

  listenerInfo.skipCount = listenerInfo.currentSkipCount
  await pool.anycastEvents(pool, listenerId, events, properties)

  if (events.length === 0) {
    return BATCH_STEP_RESULT.STOP
  }

  await pool.meta.updateListenerInfo(listenerId, {
    SkipCount: listenerInfo.skipCount,
    AbutTimestamp: listenerInfo.abutTimestamp
  })

  return BATCH_STEP_RESULT.CONTINUE
}

export default followTopicBatchStep
