const createAdapter = (implementation, options) => {
  const { performanceTracer } = options

  const {
    connect,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    disconnect,
    dropReadModel,
    ...storeApi
  } = implementation

  const baseAdapterPool = Object.create(null)
  Object.assign(baseAdapterPool, { performanceTracer })
  const adapterPoolMap = new Map()

  const doConnect = async readModelName => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('connect') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:connect')
    }

    const adapterPool = Object.create(baseAdapterPool)
    try {
      await connect(
        adapterPool,
        options
      )

      const store = Object.keys(storeApi).reduce((acc, key) => {
        acc[key] = storeApi[key].bind(null, adapterPool, readModelName)
        return acc
      }, {})
      store.performanceTracer = performanceTracer

      const resultStore = Object.freeze(Object.create(store))

      adapterPoolMap.set(resultStore, adapterPool)

      return resultStore
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
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('disconnect') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:disconnect')
    }

    try {
      for (const key of Object.keys(Object.getPrototypeOf(store))) {
        delete Object.getPrototypeOf(store)[key]
      }

      const adapterPool = adapterPoolMap.get(store)
      await disconnect(adapterPool)
    } catch (error) {
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    } finally {
      if (subSegment != null) {
        subSegment.close()
      }

      adapterPoolMap.delete(store)
    }
  }

  const doDrop = async (store, readModelName) => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('drop') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:drop')
    }

    const adapterPool = adapterPoolMap.get(store)

    try {
      await dropReadModel(adapterPool, readModelName)
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

  const doBeginTransaction = async (store, readModelName) => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment
      ? segment.addNewSubsegment('beginTransaction')
      : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:beginTransaction')
    }

    const adapterPool = adapterPoolMap.get(store)

    try {
      await beginTransaction(adapterPool, readModelName)
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

  const doCommitTransaction = async (store, readModelName) => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment
      ? segment.addNewSubsegment('commitTransaction')
      : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:readmodel:commitTransaction')
    }

    const adapterPool = adapterPoolMap.get(store)

    try {
      await commitTransaction(adapterPool, readModelName)
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

  const doRollbackTransaction = async (store, readModelName) => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment
      ? segment.addNewSubsegment('rollbackTransaction')
      : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation(
        'origin',
        'resolve:readmodel:rollbackTransaction'
      )
    }

    const adapterPool = adapterPoolMap.get(store)

    try {
      await rollbackTransaction(adapterPool, readModelName)
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
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment('dispose') : null

    if (subSegment != null) {
      subSegment.addAnnotation('origin', 'resolve:readmodel:dispose')
    }

    try {
      for (const [store, adapterPool] of adapterPoolMap.entries()) {
        await disconnect(adapterPool)

        for (const key of Object.keys(Object.getPrototypeOf(store))) {
          delete Object.getPrototypeOf(store)[key]
        }
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

  return Object.freeze({
    connect: doConnect,
    beginTransaction: doBeginTransaction,
    commitTransaction: doCommitTransaction,
    rollbackTransaction: doRollbackTransaction,
    disconnect: doDisconnect,
    drop: doDrop,
    dispose: doDispose
  })
}

export default createAdapter
