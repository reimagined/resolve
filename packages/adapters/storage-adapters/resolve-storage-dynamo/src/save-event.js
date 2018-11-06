import { ConcurrentError } from 'resolve-storage-base'
import {
  globalPartitionKey,
  temporaryErrors,
  duplicateError
} from './constants'

const saveEvent = async ({ documentClient, config: { tableName } }, event) => {
  while (true) {
    try {
      await documentClient
        .put({
          TableName: tableName,
          Item: {
            globalPartitionKey: globalPartitionKey,
            ...event
          },
          ConditionExpression:
            'attribute_not_exists(aggregateId) AND attribute_not_exists(aggregateVersion)'
        })
        .promise()
      break
    } catch (error) {
      if (error.code === duplicateError) {
        throw new ConcurrentError(
          `Can not save the event because aggregate '${
            event.aggregateId
          }' is not actual at the moment. Please retry later.`
        )
      }
      if (!temporaryErrors.includes(error.code)) {
        throw error
      }
    }
  }
}

export default saveEvent
