const createViewModel = (
  init,
  getLastError,
  read,
  readAndSerialize,
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
    activeWorkers: new Map(),
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
    eventHandler,
    getKey,
    read
  }

  return Object.freeze({
    read: read.bind(null, repository),
    readAndSerialize: readAndSerialize.bind(null, repository),
    // eslint-disable-next-line no-new-func
    updateByEvents: Function('return Promise.resolve()'),
    getLastError: getLastError.bind(null, repository),
    dispose: dispose.bind(null, repository),
    deserialize: deserializeState
  })
}

export default createViewModel
