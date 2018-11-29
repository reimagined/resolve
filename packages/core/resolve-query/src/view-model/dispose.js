const dispose = async (repository, options = {}) => {
  if (options == null || options.constructor !== Object) {
    throw new Error(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }

  if (repository.disposePromise != null) {
    return await repository.disposePromise
  }
  for (const [key, viewModel] of repository.activeWorkers.entries()) {
    viewModel.disposed = true
  }

  repository.disposePromise = repository.snapshotAdapter.dispose(options)
  repository.activeWorkers.clear()

  return await repository.disposePromise
}

export default dispose
