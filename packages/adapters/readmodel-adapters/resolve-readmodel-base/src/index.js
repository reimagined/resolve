const createAdapter = (implementation, options) => {
  const { connect, disconnect, dropReadModel, ...storeApi } = implementation
  const adapterPool = Object.create(null)
  let connectionPromise = null
  const connectedReadModels = new Set()

  const doConnect = async readModelName => {
    if (connectionPromise == null) {
      connectionPromise = connect(
        adapterPool,
        options
      )
    }
    await connectionPromise
    connectedReadModels.add(readModelName)

    const store = Object.keys(storeApi).reduce((acc, key) => {
      acc[key] = storeApi[key].bind(null, adapterPool, readModelName)
      return acc
    }, {})

    return Object.freeze(Object.create(store))
  }

  const doDisconnect = async (store, readModelName) => {
    if (connectionPromise == null) {
      return
    }
    await connectionPromise

    for (const key of Object.keys(Object.getPrototypeOf(store))) {
      delete Object.getPrototypeOf(store)[key]
    }

    connectedReadModels.delete(readModelName)

    if (connectedReadModels.size === 0) {
      await disconnect(adapterPool)
      connectionPromise = null
    }
  }

  const doDrop = async (store, readModelName) => {
    if (connectionPromise == null) {
      connectionPromise = connect(
        adapterPool,
        options
      )
    }
    connectedReadModels.add(readModelName)
    await connectionPromise

    await dropReadModel(adapterPool, readModelName)

    connectedReadModels.delete(readModelName)

    if (connectedReadModels.size === 0) {
      await disconnect(adapterPool)
      connectionPromise = null
    }
  }

  const doDispose = async () => {
    if (connectionPromise == null) {
      return
    }
    await connectionPromise
    await disconnect(adapterPool)
    connectionPromise = null
  }

  return Object.freeze({
    connect: doConnect,
    disconnect: doDisconnect,
    drop: doDrop,
    dispose: doDispose
  })
}

export default createAdapter
