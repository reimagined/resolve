const createAdapter = (
  bindWithConnection,
  bindReadModel,
  read,
  readAndSerialize,
  updateByEvents,
  disposeReadModel,
  dispose,
  implementation,
  options
) => {
  const { connect, disconnect, drop, ...storeApi } = implementation

  const pool = {
    read,
    readAndSerialize,
    updateByEvents,
    disposeReadModel,
    adapterPool: Object.create(null),
    bindWithConnection,
    storeApi,
    connect,
    options
  }

  Object.assign(pool, {
    disconnect: bindWithConnection(pool, disconnect),
    drop: bindWithConnection(pool, drop)
  })

  return Object.create(null, {
    bindReadModel: {
      value: bindReadModel.bind(null, pool)
    },
    dispose: {
      value: dispose.bind(null, pool)
    }
  })
}

export default createAdapter
