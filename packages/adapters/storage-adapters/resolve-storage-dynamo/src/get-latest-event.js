const getLatestEvent = async (pool, filter) => {
  const {
    createTypeExpression,
    createTimestampExpression,
    createAggregateIdExpression,
    createQuery,
    executeSingleQuery,
    documentClient,
    decodeEmptyStrings
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

  query.ScanIndexForward = false

  const result = await executeSingleQuery(documentClient, query)

  const items =
    result != null && Array.isArray(result.Items) ? result.Items : []

  return items.length > 0 ? decodeEmptyStrings(items[0]) : null
}

export default getLatestEvent
