const loadEvents = async readModel => {
  if (readModel.hasOwnProperty('loadEventsPromise')) {
    return await readModel.loadEventsPromise
  }

  let loadEventsResolve, loadEventsReject
  readModel.loadEventsPromise = new Promise((resolve, reject) => {
    loadEventsResolve = resolve
    loadEventsReject = reject
  })

  const { eventStore, initHandler } = readModel
  const lastTimestamp = await readModel.metaApi.getLastTimestamp()

  if (lastTimestamp == null) {
    try {
      if (!(await readModel.metaApi.beginTransaction())) {
        // eslint-disable-next-line no-console
        console.log(
          `Process attempted to write into read-model ${
            readModel.readModelName
          } simultaneously and have been blocked`
        )
        delete readModel.loadEventsPromise
        return
      }
      await initHandler(readModel.writeStoreApi)
      await readModel.metaApi.setLastTimestamp(0)
      await readModel.metaApi.commitTransaction()
    } catch (error) {
      await readModel.metaApi.rollbackTransaction()
      loadEventsReject(error)

      const promise = readModel.loadEventsPromise
      delete readModel.loadEventsPromise
      return await promise
    }
  }

  try {
    await eventStore.loadEvents(
      {
        eventTypes: readModel.eventTypes,
        startTime: lastTimestamp,
        skipBus: true
      },
      readModel.boundProjectionInvoker
    )
  } catch (err) {}

  if (readModel.hasOwnProperty('lastError')) {
    loadEventsReject(readModel.lastError)
  } else {
    loadEventsResolve()
  }

  const promise = readModel.loadEventsPromise
  delete readModel.loadEventsPromise
  return await promise
}

export default loadEvents
