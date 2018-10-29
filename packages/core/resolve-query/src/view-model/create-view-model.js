const createViewModel = (
  init,
  getViewModel,
  getLastError,
  read,
  readAndSerialize,
  updateByEvents,
  dispose,
  eventHandler,
  getKey,
  {
    projection,
    eventStore,
    snapshotAdapter = null,
    invariantHash = null,
    serializeState,
    deserializeState
  }
) => {
  if (
    (invariantHash == null || invariantHash.constructor !== String) &&
    snapshotAdapter != null
  ) {
    throw new Error(
      `Field 'invariantHash' is mandatory when using view-model snapshots`
    )
  }

  const repository = {
    viewMap: new Map(),
    eventTypes: Object.keys(projection).filter(
      eventName => eventName !== 'Init'
    ),
    projection,
    eventStore,
    snapshotAdapter,
    invariantHash,
    serializeState,
    deserializeState,
    init,
    getViewModel,
    eventHandler,
    getKey,
    read
  }

  return Object.freeze({
    read: read.bind(null, repository),
    readAndSerialize: readAndSerialize.bind(null, repository),
    updateByEvents: updateByEvents.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    dispose: dispose.bind(null, repository),
    deserialize: deserializeState
  })
}

export default createViewModel
