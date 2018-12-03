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
    const { readModelName, adapter, projection, projectionInvoker } = repository

    const {
      metaApi,
      readStoreApi,
      writeStoreApi
    } = await adapter.bindReadModel(readModelName)

    Object.assign(repository, {
      boundProjectionInvoker: projectionInvoker.bind(null, repository),
      eventTypes: Object.keys(projection),
      readStoreApi,
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
