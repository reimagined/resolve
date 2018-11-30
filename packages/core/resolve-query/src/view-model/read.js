const read = async (repository, { aggregateIds } = {}) => {
  if (
    aggregateIds !== '*' &&
    (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
  ) {
    throw new Error(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }

  const key = repository.getKey(aggregateIds)
  if (!repository.activeWorkers.has(key)) {
    repository.activeWorkers.set(
      key,
      repository.init(repository, aggregateIds, key)
    )
  }

  try {
    const viewModel = await repository.activeWorkers.get(key)
    repository.activeWorkers.delete(key)

    return viewModel.state
  } catch (error) {
    repository.activeWorkers.delete(key)

    return null
  }
}

export default read
