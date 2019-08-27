import { ConcurrentError } from 'resolve-storage-base'
import {
  globalPartitionKey,
  temporaryErrors,
  duplicateError
} from './constants'

const saveEvent = async (pool, event) => {
  const { documentClient, tableName, encodeEvent } = pool
  while (true) {
    try {
      await documentClient
        .put({
          TableName: tableName,
          Item: {
            globalPartitionKey: globalPartitionKey,
            ...encodeEvent(pool, event)
          },
          ConditionExpression:
            'attribute_not_exists(aggregateId) AND attribute_not_exists(aggregateVersion)'
        })
        .promise()
      break
    } catch (error) {
      if (error.code === duplicateError) {
        throw new ConcurrentError(event.aggregateId)
      }
      if (!temporaryErrors.includes(error.code)) {
        throw error
      }
    }
  }
}

export default saveEvent
