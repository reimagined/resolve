const getLastError = async (repository, { aggregateIds } = {}) => {
  const viewModel = repository.getViewModel(repository, aggregateIds, false)
  if (viewModel == null) {
    return null
  }

  if (viewModel.hasOwnProperty('lastError')) {
    return viewModel.lastError
  }

  if (!viewModel.hasOwnProperty('initPromise')) {
    return null
  }

  try {
    await viewModel.initPromise
  } catch (error) {
    return error
  }

  return null
}

export default getLastError
