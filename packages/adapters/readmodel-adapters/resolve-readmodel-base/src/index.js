const createAdapter = (implementation, options) => {
  const { connect, disconnect, dropReadModel, ...storeApi } = implementation
  const adapterPool = Object.create(null)
  let connectionPromise = null

  const doConnect = async readModelName => {
    if (connectionPromise == null) {
      connectionPromise = connect(
        adapterPool,
        options
      )
    }
    await connectionPromise

    const api = Object.keys(storeApi).reduce((acc, key) => {
      acc[key] = storeApi[key].bind(null, adapterPool, readModelName)
      return acc
    }, {})

    return Object.freeze(api)
  }

  const doDisconnect = async () => {
    if (connectionPromise != null) {
      await connectionPromise

      await disconnect(adapterPool)

      connectionPromise = null
    }
  }

  const doDrop = async readModelName => {
    if (connectionPromise == null) {
      connectionPromise = connect(
        adapterPool,
        options
      )
    }
    await connectionPromise

    await dropReadModel(adapterPool, readModelName)
  }

  return Object.freeze({
    connect: doConnect,
    disconnect: doDisconnect,
    drop: doDrop
  })
}

export default createAdapter
