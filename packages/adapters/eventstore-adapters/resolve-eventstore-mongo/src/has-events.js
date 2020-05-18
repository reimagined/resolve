const projectionExpression = { aggregateId: 1, aggregateVersion: 1, _id: 0 }

const hasEvents = async ({ database, collectionName }, events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return []
  }

  const findExpression = {
    $or: events.map(({ aggregateId, aggregateVersion }) => ({
      aggregateId: { $eq: aggregateId },
      aggregateVersion: { $eq: aggregateVersion }
    }))
  }

  const collection = await database.collection(collectionName)

  const result = await collection
    .find(findExpression)
    .project(projectionExpression)
    .toArray()

  const resultSet = new Set()
  for (const { aggregateId, aggregateVersion } of result) {
    resultSet.add(`${aggregateId}-${aggregateVersion}`)
  }

  return events.map(({ aggregateId, aggregateVersion }) =>
    resultSet.has(`${aggregateId}-${aggregateVersion}`)
  )
}

export default hasEvents
