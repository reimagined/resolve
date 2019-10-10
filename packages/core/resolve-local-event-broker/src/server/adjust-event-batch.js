const adjustEventBatch = async (listenerInfo, events, event) => {
  if (
    event.timestamp === listenerInfo.abutTimestamp &&
    listenerInfo.currentSkipCount < listenerInfo.skipCount
  ) {
    listenerInfo.currentSkipCount++
    return
  }

  listenerInfo.skipCount = 0
  if (event.timestamp === listenerInfo.abutTimestamp) {
    listenerInfo.currentSkipCount++
  } else {
    listenerInfo.abutTimestamp = event.timestamp
    listenerInfo.currentSkipCount = 0
  }

  events.push(event)
}

export default adjustEventBatch
