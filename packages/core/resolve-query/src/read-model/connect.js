const connect = async repository => {
  if (repository.hasOwnProperty('connectPromise')) {
    return await repository.connectPromise
  }

  let connectResolve, connectReject
  repository.connectPromise = new Promise((resolve, reject) => {
    connectResolve = resolve
    connectReject = reject
  })

  try {
    const {
      readModelName,
      adapter,
      projection,
      projectionInvoker,
      waitEventCausalConsistency
    } = repository

    const {
      metaApi,
      readStoreApi,
      writeStoreApi
    } = await adapter.bindReadModel(readModelName)

    Object.assign(repository, {
      boundProjectionInvoker: projectionInvoker.bind(null, repository),
      eventTypes: Object.keys(projection),
      readStoreApi: Object.freeze(
        Object.create(readStoreApi, {
          waitEventCausalConsistency: {
            value: waitEventCausalConsistency.bind(null, repository)
          }
        })
      ),
      writeStoreApi,
      metaApi
    })

    connectResolve()
  } catch (error) {
    connectReject(error)
  }

  return await repository.connectPromise
}

export default connect
