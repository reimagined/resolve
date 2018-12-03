const loadEvents = async repository => {
  if (repository.hasOwnProperty('loadEventsPromise')) {
    return await repository.loadEventsPromise
  }

  let loadEventsResolve, loadEventsReject
  repository.loadEventsPromise = new Promise((resolve, reject) => {
    loadEventsResolve = resolve
    loadEventsReject = reject
  })

  const { eventStore, initHandler } = repository
  const lastTimestamp = await repository.metaApi.getLastTimestamp()

  if (lastTimestamp == null) {
    try {
      if (!(await repository.metaApi.beginTransaction())) {
        // eslint-disable-next-line no-console
        console.log(
          `Process attempted to write into read-model ${
            repository.readModelName
          } simultaneously and have been blocked`
        )
        delete repository.loadEventsPromise
        return
      }
      await initHandler(repository.writeStoreApi)
      await repository.metaApi.setLastTimestamp(0)
      await repository.metaApi.commitTransaction()
    } catch (error) {
      await repository.metaApi.rollbackTransaction()
      loadEventsReject(error)

      const promise = repository.loadEventsPromise
      delete repository.loadEventsPromise
      return await promise
    }
  }

  try {
    await eventStore.loadEvents(
      {
        eventTypes: repository.eventTypes,
        startTime: lastTimestamp,
        skipBus: true
      },
      repository.boundProjectionInvoker
    )
  } catch (err) {}

  if (repository.hasOwnProperty('lastError')) {
    loadEventsReject(repository.lastError)
  } else {
    loadEventsResolve()
  }

  const promise = repository.loadEventsPromise
  delete repository.loadEventsPromise
  return await promise
}

export default loadEvents
