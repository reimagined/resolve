const read = async (repository, { aggregateIds } = {}) => {
  if (
    aggregateIds !== '*' &&
    (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
  ) {
    throw new Error(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }

  const getViewModel = repository.getViewModel.bind(
    null,
    repository,
    aggregateIds
  )

  try {
    const viewModel = getViewModel(true)
    await viewModel.initPromise

    getViewModel(false).initPromise.catch(() => null)

    return viewModel.state
  } catch (error) {
    return null
  }
}

export default read
