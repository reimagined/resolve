import { ResourceNotExistError } from './lifecycle-errors'
import {
  BATCHES_TABLE_NAME,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME
} from '../constants'

async function dropDatabase({ database: { runRawQuery, escapeId } }) {
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  const notificationsSubscriptionIdIndexNameAsId = escapeId(
    `${NOTIFICATIONS_TABLE_NAME}-subscriptionId`
  )
  const notificationsBatchIdIndexNameAsId = escapeId(
    `${NOTIFICATIONS_TABLE_NAME}-batchId`
  )

  const subscribersEventSubscriberIndexNameAsId = escapeId(
    `${SUBSCRIBERS_TABLE_NAME}-eventSubscriber`
  )
  const batchesBatchIdIndexNameAsId = escapeId(`${BATCHES_TABLE_NAME}-batchId`)

  try {
    await runRawQuery(`
      DROP TABLE IF EXISTS ${notificationsTableNameAsId};
      
      DROP TABLE IF EXISTS ${subscribersTableNameAsId};
      
      DROP TABLE IF EXISTS ${batchesTableNameAsId};
      
      DROP INDEX IF EXISTS ${notificationsSubscriptionIdIndexNameAsId};

      DROP INDEX IF EXISTS ${notificationsBatchIdIndexNameAsId};

      DROP INDEX IF EXISTS ${subscribersEventSubscriberIndexNameAsId};
      
      DROP INDEX IF EXISTS ${batchesBatchIdIndexNameAsId};
      
      COMMIT;
      BEGIN IMMEDIATE;
    `)
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR: no such table.*?$/.test(error.message)
    ) {
      throw new ResourceNotExistError(`Double-free event-bus database failed`)
    } else {
      throw error
    }
  }
}

export default dropDatabase
