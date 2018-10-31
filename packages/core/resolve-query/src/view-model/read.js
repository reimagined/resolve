const read = async (repository, { aggregateIds } = {}) => {
  if (
    aggregateIds !== '*' &&
    (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
  ) {
    throw new Error(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }

  try {
    const viewModel = repository.getViewModel(repository, aggregateIds, true)
    await viewModel.initPromise
    return viewModel.state
  } catch (error) {
    return null
  }
}

export default read
