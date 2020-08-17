const queryIsReadyHandler = async (req, res) => {
  try {
    const { eventstoreAdapter, eventBus, eventListeners } = req.resolve
    const queryIsReadyPromises = []

    for (const [listenerName, { eventTypes }] of eventListeners) {
      queryIsReadyPromises.push(
        (async () => {
          const latestEvent = await eventstoreAdapter.getLatestEvent(eventTypes)
          if (latestEvent == null) {
            return
          }

          let lastError, lastEvent
          while (lastError != null) {
            void ({ lastEvent, lastError } = await eventBus.status({
              eventSubscriber: listenerName
            }))
            if (
              lastEvent != null &&
              lastEvent.timestamp >= latestEvent.timestamp
            ) {
              break
            }
          }
        })()
      )
    }

    await Promise.all(queryIsReadyPromises)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default queryIsReadyHandler
