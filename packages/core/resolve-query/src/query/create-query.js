const createQuery = (
  createReadModel,
  createViewModel,
  initReadModels,
  initViewModels,
  checkInitErrors,
  checkQueryDisposeState,
  getExecutor,
  read,
  readAndSerialize,
  getLastError,
  getModelType,
  getDeserializer,
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
  const repository = {
    updateRequest: doUpdateRequest == null ? updateRequest : doUpdateRequest,
    executors: new Map(),
    executorTypes: new Map(),
    errorMessages: [],
    disposePromise: null,
    createReadModel,
    createViewModel,
    checkQueryDisposeState,
    getExecutor,
    getModelType
  }

  if (doUpdateRequest != null && typeof doUpdateRequest !== 'function') {
    repository.errorMessages.push(
      'Parameter `doUpdateRequest` should be function'
    )
  }

  initReadModels({ ...repository, eventStore, readModels, readModelAdapters })
  initViewModels({ ...repository, eventStore, viewModels, snapshotAdapter })
  checkInitErrors(repository)

  const api = Object.freeze({
    getExecutor: getExecutor.bind(null, repository),
    read: read.bind(null, repository),
    readAndSerialize: readAndSerialize.bind(null, repository),
    getLastError: getLastError.bind(null, repository),
    getModelType: getModelType.bind(null, repository),
    getDeserializer: getDeserializer.bind(null, repository),
    dispose: dispose.bind(null, repository),
    getExecutors: getExecutors.bind(null, repository)
  })

  const query = (...args) => api.read(...args)
  Object.assign(query, api)
  return query
}

export default createQuery
