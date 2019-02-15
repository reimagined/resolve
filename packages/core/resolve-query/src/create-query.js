const createQuery = (
  initReadModels,
  initViewModels,
  createViewModelAdapter,
  checkInitErrors,
  checkQueryDisposeState,
  getExecutor,
  read,
  readAndSerialize,
  getLastError,
  getModelType,
  dispose,
  getExecutors,
  updateRequest,
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
    updateRequest: doUpdateRequest == null ? updateRequest : doUpdateRequest,
    createViewModelAdapter,
    executors: new Map(),
    executorTypes: new Map(),
    errorMessages: [],
    disposePromise: null,
    checkQueryDisposeState,
    getExecutor,
    getModelType
  }

  if (doUpdateRequest != null && typeof doUpdateRequest !== 'function') {
    pool.errorMessages.push('Parameter `doUpdateRequest` should be function')
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
    getLastError: getLastError.bind(null, pool),
    getModelType: getModelType.bind(null, pool),
    dispose: dispose.bind(null, pool),
    getExecutors: getExecutors.bind(null, pool)
  })

  const query = (...args) => api.read(...args)
  Object.assign(query, api)
  return query
}

export default createQuery
