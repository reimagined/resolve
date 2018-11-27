const createAggregateIdExpression = ({ aggregateIds }) => {
  const conditionExpression =
    aggregateIds == null || aggregateIds.length === 0
      ? ''
      : aggregateIds.length === 1
      ? `(#aggregateId = :aggregateId0)`
      : `(#aggregateId IN (${aggregateIds.map(
          (aggregateId, aggregateIdIndex) => `:aggregateId${aggregateIdIndex}`
        )}))`

  const attributeNames =
    aggregateIds != null && aggregateIds.length > 0
      ? {
          '#aggregateId': 'aggregateId'
        }
      : {}

  const attributeValues =
    aggregateIds != null && aggregateIds.length > 0
      ? aggregateIds.reduce((obj, aggregateId, index) => {
          obj[`:aggregateId${index}`] = aggregateId
          return obj
        }, {})
      : {}

  return {
    conditionExpression,
    attributeNames,
    attributeValues
  }
}

export default createAggregateIdExpression
