const dispose = async (repository, options = {}) => {
  if (options == null || options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  if (repository.disposePromise) {
    return await repository.disposePromise
  }

  if (!repository.hasOwnProperty('boundProjectionInvoker')) {
    return
  }

  const disposePromise = repository.metaApi.dropReadModel()

  for (const key of Object.keys(repository)) {
    delete repository[key]
  }

  repository.disposePromise = disposePromise
  return await repository.disposePromise
}

export default dispose
