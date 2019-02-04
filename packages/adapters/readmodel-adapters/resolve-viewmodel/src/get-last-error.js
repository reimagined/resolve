const getLastError = async (pool, { aggregateIds } = {}) => {
  const key = pool.getKey(aggregateIds)
  if (!pool.activeWorkers.has(key)) {
    return null
  }

  const viewModel = await pool.activeWorkers.get(key)
  if (viewModel.hasOwnProperty('lastError')) {
    return viewModel.lastError
  }

  return null
}

export default getLastError
