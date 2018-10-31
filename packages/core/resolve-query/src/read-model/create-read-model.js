const createReadModel = (
  init,
  getModelReadInterface,
  getLastError,
  read,
  readAndSerialize,
  updateByEvents,
  resolverNames,
  dispose,
  projectionInvoker,
  deserialize,
  { adapter, projection, eventStore, resolvers }
) => {
  const repository = {
    projection: projection != null ? adapter.buildProjection(projection) : null,
    resolvers: resolvers != null ? resolvers : {},
    adapter,
    eventStore,
    init,
    getModelReadInterface,
    projectionInvoker,
    read
  }

  return Object.freeze({
    getReadInterface: getModelReadInterface.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    read: read.bind(null, repository),
    readAndSerialize: readAndSerialize.bind(null, repository),
    updateByEvents: updateByEvents.bind(null, repository),
    resolverNames: resolverNames.bind(null, repository),
    dispose: dispose.bind(null, repository),
    deserialize
  })
}

export default createReadModel
