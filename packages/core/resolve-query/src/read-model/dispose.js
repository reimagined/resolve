const dispose = (repository, options = {}) => {
  if (options == null || options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  if (repository.disposePromise) {
    return repository.disposePromise
  }

  if (!repository.hasOwnProperty('prepareProjection')) {
    return
  }

  const disposePromise = repository.adapter.reset(options)

  Object.keys(repository).forEach(key => {
    delete repository[key]
  })

  repository.disposePromise = disposePromise
  return repository.disposePromise
}

export default dispose
