const createAdapter = (implementation, options) => {
  const { performanceTracer } = options

  const {
    connect,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    beginXATransaction,
    commitXATransaction,
    rollbackXATransaction,
    beginEvent,
    commitEvent,
    rollbackEvent,
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
      await connect(adapterPool, options)

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

  const doOperation = async (
    operationName,
    operationFunc,
    store,
    readModelName,
    parameters
  ) => {
    const segment = performanceTracer ? performanceTracer.getSegment() : null
    const subSegment = segment ? segment.addNewSubsegment(operationName) : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', `resolve:readmodel:${operationName}`)
    }

    const adapterPool = adapterPoolMap.get(store)

    try {
      return await operationFunc(adapterPool, readModelName, parameters)
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

  const makeOperation = (operationName, operationFunc) => {
    if (typeof operationFunc === 'function') {
      return doOperation.bind(null, operationName, operationFunc)
    } else {
      return null
    }
  }

  const doDrop = makeOperation('dropReadModel', dropReadModel)

  const doBeginTransaction = makeOperation('beginTransaction', beginTransaction)

  const doCommitTransaction = makeOperation(
    'commitTransaction',
    commitTransaction
  )

  const doRollbackTransaction = makeOperation(
    'rollbackTransaction',
    rollbackTransaction
  )

  const doBeginXATransaction = makeOperation(
    'beginXATransaction',
    beginXATransaction
  )

  const doCommitXATransaction = makeOperation(
    'commitXATransaction',
    commitXATransaction
  )

  const doRollbackXATransaction = makeOperation(
    'rollbackXATransaction',
    rollbackXATransaction
  )

  const doBeginEvent = makeOperation('beginEvent', beginEvent)

  const doCommitEvent = makeOperation('commitEvent', commitEvent)

  const doRollbackEvent = makeOperation('rollbackEvent', rollbackEvent)

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
    beginXATransaction: doBeginXATransaction,
    commitXATransaction: doCommitXATransaction,
    rollbackXATransaction: doRollbackXATransaction,
    beginEvent: doBeginEvent,
    commitEvent: doCommitEvent,
    rollbackEvent: doRollbackEvent,
    disconnect: doDisconnect,
    drop: doDrop,
    dispose: doDispose
  })
}

export default createAdapter
