const init = async (repository, skipEventReading = false) => {
  const { adapter, eventStore, projection, projectionInvoker } = repository

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
  }

  const { lastTimestamp } = await repository.prepareProjection()
  if (skipEventReading) {
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
