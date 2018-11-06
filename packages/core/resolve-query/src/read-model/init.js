const init = async (repository, skipEventReading = false) => {
  const { adapter, eventStore, projection, projectionInvoker } = repository
  let readStorageAnyway = false

  if (!repository.prepareProjection) {
    const { prepareProjection, getReadInterface } = adapter.init()
    Object.assign(repository, { prepareProjection, getReadInterface })

    if (projection == null) {
      return
    }

    Object.assign(repository, {
      boundProjectionInvoker: projectionInvoker.bind(null, repository),
      eventTypes: Object.keys(projection)
    })

    readStorageAnyway = true
  }

  const { lastTimestamp } = await repository.prepareProjection()
  if (skipEventReading && !readStorageAnyway) {
    delete repository.loadDonePromise
    return
  }

  await eventStore.loadEvents(
    {
      eventTypes: repository.eventTypes,
      startTime: lastTimestamp,
      skipBus: true
    },
    repository.boundProjectionInvoker
  )

  delete repository.loadDonePromise
}

export default init
