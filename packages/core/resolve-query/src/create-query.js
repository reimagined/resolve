const createQuery = (
  initReadModels,
  initViewModels,
  createViewModelAdapter,
  checkInitErrors,
  checkQueryDisposeState,
  getExecutor,
  read,
  readAndSerialize,
  getModelType,
  dispose,
  getExecutors,
  {
    eventStore,
    viewModels,
    readModels,
    snapshotAdapter,
    readModelAdapters,
    doUpdateRequest
  }
) => {
  const pool = {
    createViewModelAdapter,
    executors: new Map(),
    executorTypes: new Map(),
    errorMessages: [],
    disposePromise: null,
    checkQueryDisposeState,
    getExecutor,
    getModelType
  }

  if (typeof doUpdateRequest !== 'function') {
    pool.errorMessages.push('Parameter `doUpdateRequest` should be function')
  } else {
    pool.updateRequest = doUpdateRequest
  }

  initReadModels({
    ...pool,
    eventStore,
    readModels,
    readModelAdapters
  })

  initViewModels({
    ...pool,
    eventStore,
    viewModels,
    snapshotAdapter
  })

  checkInitErrors(pool)

  const api = Object.freeze({
    getExecutor: getExecutor.bind(null, pool),
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    getModelType: getModelType.bind(null, pool),
    dispose: dispose.bind(null, pool),
    getExecutors: getExecutors.bind(null, pool)
  })

  const query = (...args) => api.read(...args)
  Object.assign(query, api)
  return query
}

export default createQuery
