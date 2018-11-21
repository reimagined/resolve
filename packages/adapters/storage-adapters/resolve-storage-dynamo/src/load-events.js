const loadEvents = async (pool, filter, callback) => {
  const {
    createTypeExpression,
    createTimestampExpression,
    createAggregateIdExpression,
    createQuery,
    executePaginationQuery
  } = pool

  const {
    conditionExpression: typeConditionExpression,
    attributeNames: typeAttributeNames,
    attributeValues: typeAttributeValues
  } = createTypeExpression(filter)

  const {
    conditionExpression: timestampConditionExpression,
    attributeNames: timestampAttributeNames,
    attributeValues: timestampAttributeValues
  } = createTimestampExpression(filter)

  const {
    conditionExpression: aggregateIdConditionExpression,
    attributeNames: aggregateIdAttributeNames,
    attributeValues: aggregateIdAttributeValues
  } = createAggregateIdExpression(filter)

  const query = createQuery(pool, filter, {
    aggregateIdAttributeNames,
    aggregateIdAttributeValues,
    aggregateIdConditionExpression,
    typeAttributeNames,
    typeAttributeValues,
    typeConditionExpression,
    timestampAttributeNames,
    timestampAttributeValues,
    timestampConditionExpression
  })

  await executePaginationQuery(pool, query, callback)
}

export default loadEvents
