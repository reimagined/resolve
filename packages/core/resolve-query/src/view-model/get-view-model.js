const getViewModel = (
  repository,
  aggregateIds,
  doInit,
  skipEventReading = false
) => {
  const key = repository.getKey(aggregateIds)

  if (!repository.viewMap.has(key)) {
    if (doInit) {
      repository.viewMap.set(key, {})
    } else {
      return null
    }
  }

  const viewModel = repository.viewMap.get(key)

  if (!viewModel.hasOwnProperty('initPromise')) {
    viewModel.initPromise = repository.init(
      repository,
      key,
      aggregateIds,
      skipEventReading
    )
  }

  return viewModel
}

export default getViewModel
