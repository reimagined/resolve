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
  const prevCursor = listenerInfo.cursor

  await pool.eventStore.loadEvents(
    {
      cursor: prevCursor,
      limit: pool.config.batchSize,
      eventTypes
    },
    event => events.push(event)
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
      Cursor: null,
      LastEvent: initialEvent
    })
  }

  const anycastResult = await pool.anycastEvents(
    pool,
    listenerId,
    events,
    properties
  )

  if (events.length === 0 || anycastResult == null) {
    return BATCH_STEP_RESULT.STOP
  }

  const lastAppliedEvent =
    anycastResult.lastEvent != null ? anycastResult.lastEvent : {}

  const lastAppliedEventIndex = events.findIndex(
    ({ aggregateId, aggregateVersion }) =>
      lastAppliedEvent.aggregateId === aggregateId &&
      lastAppliedEvent.aggregateVersion === aggregateVersion
  )

  const nextCursor = pool.eventStore.getNextCursor(
    prevCursor,
    events.slice(0, lastAppliedEventIndex + 1)
  )

  await pool.updateListenerInfo(listenerId, {
    Cursor: nextCursor
  })

  return BATCH_STEP_RESULT.CONTINUE
}

export default followTopicBatchStep
