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
  { eventStore, viewModels, readModels, snapshotAdapter }
) => {
  const repository = {
    executors: new Map(),
    executorTypes: new Map(),
    errorMessages: [],
    disposePromise: null,
    createReadModel,
    createViewModel,
    checkQueryDisposeState,
    getExecutor
  }

  initReadModels({ ...repository, eventStore, readModels, snapshotAdapter })
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
