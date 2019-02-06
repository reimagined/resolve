const read = async (pool, { aggregateIds } = {}) => {
  if (
    aggregateIds !== '*' &&
    (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
  ) {
    throw new Error(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }

  const key = pool.getKey(aggregateIds)
  if (!pool.activeWorkers.has(key)) {
    pool.activeWorkers.set(key, pool.init(pool, aggregateIds, key))
  }

  try {
    const viewModel = await pool.activeWorkers.get(key)
    pool.activeWorkers.delete(key)

    return viewModel.state
  } catch (error) {
    pool.activeWorkers.delete(key)

    return null
  }
}

export default read
