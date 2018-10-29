const getKey = aggregateIds =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

export default getKey
