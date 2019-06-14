const createAdapter = (implementation, options) => {
  const { performanceTracer } = options

  const { connect, disconnect, dropReadModel, ...storeApi } = implementation
  const adapterPool = Object.create(null)
  Object.assign(adapterPool, { performanceTracer })
  let connectionPromise = null
  const connectedReadModels = new Set()

  const doConnect = async readModelName => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('connect') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:connect')
    }

    try {
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
      store.performanceTracer = performanceTracer

      return Object.freeze(Object.create(store))
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }
    }
  }

  const doDisconnect = async (store, readModelName) => {
    if (connectionPromise == null) {
      return
    }

    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('disconnect') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:disconnect')
    }

    try {
      await connectionPromise

      for (const key of Object.keys(Object.getPrototypeOf(store))) {
        delete Object.getPrototypeOf(store)[key]
      }

      connectedReadModels.delete(readModelName)

      if (connectedReadModels.size === 0) {
        await disconnect(adapterPool)
        connectionPromise = null
      }
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }
    }
  }

  const doDrop = async (store, readModelName) => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('drop') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:drop')
    }

    try {
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
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }
    }
  }

  const doDispose = async () => {
    if (connectionPromise == null) {
      return
    }

    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('dispose') : null

    if (subSegment != null) {
      subSegment.addAnnotation('origin', 'resolve:readmodel:dispose')
    }

    try {
      await connectionPromise
      await disconnect(adapterPool)
      connectionPromise = null
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }
    }
  }

  return Object.freeze({
    connect: doConnect,
    disconnect: doDisconnect,
    drop: doDrop,
    dispose: doDispose
  })
}

export default createAdapter
