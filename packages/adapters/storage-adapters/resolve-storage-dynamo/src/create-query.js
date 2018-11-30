import { globalPartitionKey, rangedIndex } from './constants'

const createQuery = (
  { tableName, expressionString, expressionObject },
  { aggregateIds = [] },
  {
    aggregateIdAttributeNames,
    aggregateIdAttributeValues,
    aggregateIdConditionExpression,
    typeAttributeNames,
    typeAttributeValues,
    typeConditionExpression,
    timestampAttributeNames,
    timestampAttributeValues,
    timestampConditionExpression
  }
) => {
  return aggregateIds != null && aggregateIds.length === 1
    ? {
        TableName: tableName,
        KeyConditionExpression: expressionString(
          aggregateIdConditionExpression
        ),
        FilterExpression: expressionString(
          typeConditionExpression,
          timestampConditionExpression
        ),
        ExpressionAttributeNames: expressionObject(
          typeAttributeNames,
          timestampAttributeNames,
          aggregateIdAttributeNames
        ),
        ExpressionAttributeValues: expressionObject(
          typeAttributeValues,
          timestampAttributeValues,
          aggregateIdAttributeValues
        ),
        ScanIndexForward: true
      }
    : {
        TableName: tableName,
        IndexName: rangedIndex,
        KeyConditionExpression: expressionString(
          '(#globalPartitionKey = :globalPartitionKey)',
          timestampConditionExpression
        ),
        FilterExpression: expressionString(
          aggregateIdConditionExpression,
          typeConditionExpression
        ),
        ExpressionAttributeNames: expressionObject(
          { '#globalPartitionKey': globalPartitionKey },
          typeAttributeNames,
          timestampAttributeNames,
          aggregateIdAttributeNames
        ),
        ExpressionAttributeValues: expressionObject(
          { ':globalPartitionKey': globalPartitionKey },
          typeAttributeValues,
          timestampAttributeValues,
          aggregateIdAttributeValues
        ),
        ScanIndexForward: true
      }
}

export default createQuery
