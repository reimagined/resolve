import { READ_MODEL_STATUS, BATCH_STEP_RESULT } from '../constants'

const followTopicBatchStep = async (pool, listenerId) => {
  if (!pool.clientMap.has(listenerId)) {
    return BATCH_STEP_RESULT.STOP
  }

  const listenerInfo = await pool.getListenerInfo(listenerId)
  const properties = listenerInfo.properties
  if (!properties.hasOwnProperty('RESOLVE_SIDE_EFFECTS_START_TIMESTAMP')) {
    properties['RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'] = pool.initialTimestamp
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

  if (listenerInfo.isFirstRun) {
    const initialEvent = {
      type: 'Init',
      timestamp: events.length === 0 ? 0 : events[0].timestamp
    }
    const anycastResult = await pool.anycastEvents(
      pool,
      listenerId,
      [initialEvent],
      properties
    )

    if (anycastResult == null) {
      return BATCH_STEP_RESULT.STOP
    }

    await pool.updateListenerInfo(listenerId, {
      SkipCount: 0,
      AbutTimestamp: 0,
      LastEvent: initialEvent
    })
  }

  listenerInfo.skipCount = listenerInfo.currentSkipCount
  const anycastResult = await pool.anycastEvents(
    pool,
    listenerId,
    events,
    properties
  )

  if (events.length === 0 || anycastResult == null) {
    return BATCH_STEP_RESULT.STOP
  }

  if (anycastResult.lastEvent == null) {
    return BATCH_STEP_RESULT.CONTINUE
  }

  let abutTimestamp = 0
  let skipCount = 0

  for (let index = 0; index < events.length; index++) {
    if (events[index].timestamp !== abutTimestamp) {
      abutTimestamp = events[index].timestamp
      skipCount = 0
    } else {
      skipCount++
    }

    if (
      anycastResult.lastEvent.aggregateId === events[index].aggregateId &&
      anycastResult.lastEvent.aggregateVersion ===
        events[index].aggregateVersion
    ) {
      break
    }
  }

  await pool.updateListenerInfo(listenerId, {
    SkipCount: skipCount,
    AbutTimestamp: abutTimestamp
  })

  return BATCH_STEP_RESULT.CONTINUE
}

export default followTopicBatchStep
