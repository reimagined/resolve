const createReadModel = (
  connect,
  loadEvents,
  getLastError,
  read,
  readAndSerialize,
  updateByEvents,
  resolverNames,
  dispose,
  projectionInvoker,
  waitEventCausalConsistency,
  deserialize,
  { readModelName, adapter, projection: inputProjection, eventStore, resolvers }
) => {
  const { Init: initHandler, ...projection } =
    inputProjection != null ? inputProjection : {}

  const repository = {
    resolvers: resolvers != null ? resolvers : {},
    connect,
    initHandler,
    projection,
    readModelName,
    adapter,
    eventStore,
    loadEvents,
    projectionInvoker,
    waitEventCausalConsistency,
    read
  }

  return Object.freeze({
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
