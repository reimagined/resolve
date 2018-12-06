const getLastError = async (repository, { aggregateIds } = {}) => {
  const key = repository.getKey(aggregateIds)
  if (!repository.activeWorkers.has(key)) {
    return null
  }

  const viewModel = await repository.activeWorkers.get(key)
  if (viewModel.hasOwnProperty('lastError')) {
    return viewModel.lastError
  }

  return null
}

export default getLastError
