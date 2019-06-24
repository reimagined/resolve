import { READ_MODEL_STATUS, BATCH_STEP_RESULT } from './constants'

const followTopicBatchStep = async (pool, listenerId) => {
  if (!pool.clientMap.has(listenerId)) {
    return BATCH_STEP_RESULT.STOP
  }

  const initialEvent = { type: 'Init' }

  const listenerInfo = await pool.getListenerInfo(listenerId)
  const properties = listenerInfo.properties
  if (!properties.hasOwnProperty('RESOLVE_SIDE_EFFECTS_START_TIMESTAMP')) {
    properties['RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'] = pool.initialTimestamp
  }

  if (listenerInfo.isFirstRun) {
    const anycastResult = await pool.anycastEvents(
      pool,
      listenerId,
      [initialEvent],
      properties
    )
    if (!anycastResult) {
      return BATCH_STEP_RESULT.STOP
    }

    await pool.updateListenerInfo(listenerId, {
      SkipCount: 0,
      AbutTimestamp: 0,
      LastEvent: initialEvent
    })
  }

  const events = []
  if (listenerInfo.status !== READ_MODEL_STATUS.running) {
    return BATCH_STEP_RESULT.STOP
  }

  const eventTypes = pool.localEventTypesMap.has(listenerId)
    ? pool.localEventTypesMap.get(listenerId)
    : null

  await pool.eventStore.loadEvents(
    {
      startTime: listenerInfo.abutTimestamp,
      maxEventsByTimeframe: pool.config.batchSize,
      eventTypes
    },
    pool.adjustEventBatch.bind(null, listenerInfo, events)
  )

  listenerInfo.skipCount = listenerInfo.currentSkipCount
  const anycastResult = await pool.anycastEvents(
    pool,
    listenerId,
    events,
    properties
  )

  if (events.length === 0 || !anycastResult) {
    return BATCH_STEP_RESULT.STOP
  }

  await pool.updateListenerInfo(listenerId, {
    SkipCount: listenerInfo.skipCount,
    AbutTimestamp: listenerInfo.abutTimestamp
  })

  return BATCH_STEP_RESULT.CONTINUE
}

export default followTopicBatchStep
