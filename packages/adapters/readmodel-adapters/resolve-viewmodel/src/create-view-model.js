const createViewModel = (
  init,
  read,
  readAndSerialize,
  dispose,
  eventHandler,
  getKey,
  {
    projection: inputProjection,
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

  const { Init: initHandler, ...projection } =
    inputProjection != null ? inputProjection : {}

  const pool = {
    activeWorkers: new Map(),
    eventTypes: Object.keys(projection),
    initHandler,
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
    // eslint-disable-next-line no-new-func
    updateByEvents: Function('Promise.resolve()'),
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    dispose: dispose.bind(null, pool)
  })
}

export default createViewModel
