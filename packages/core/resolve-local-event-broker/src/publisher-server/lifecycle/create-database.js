import { ResourceAlreadyExistError } from './lifecycle-errors';
import {
  BATCHES_TABLE_NAME,
  INTEGER_SQL_TYPE,
  JSON_SQL_TYPE,
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  STRING_SQL_TYPE,
  SUBSCRIBERS_TABLE_NAME,
} from '../constants';

async function createDatabase({ database: { runRawQuery, escapeId } }) {
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME);
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME);
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME);

  const notificationsSubscriptionIdIndexNameAsId = escapeId(
    `${NOTIFICATIONS_TABLE_NAME}-subscriptionId`
  );
  const notificationsBatchIdIndexNameAsId = escapeId(
    `${NOTIFICATIONS_TABLE_NAME}-batchId`
  );

  const subscribersEventSubscriberIndexNameAsId = escapeId(
    `${SUBSCRIBERS_TABLE_NAME}-eventSubscriber`
  );
  const batchesBatchIdIndexNameAsId = escapeId(`${BATCHES_TABLE_NAME}-batchId`);

  try {
    await runRawQuery(`
      CREATE TABLE IF NOT EXISTS ${notificationsTableNameAsId}(
        "insertionId" ${STRING_SQL_TYPE} NOT NULL,
        "subscriptionId" ${STRING_SQL_TYPE} NOT NULL,
        "status" ${STRING_SQL_TYPE} NOT NULL,
        "incomingTimestamp" ${LONG_INTEGER_SQL_TYPE} NOT NULL,
        "processStartTimestamp" ${LONG_INTEGER_SQL_TYPE},
        "processEndTimestamp" ${LONG_INTEGER_SQL_TYPE},
        "heartbeatTimestamp" ${LONG_INTEGER_SQL_TYPE},
        "aggregateIdAndVersion" ${STRING_SQL_TYPE} NOT NULL,
        "xaTransactionId" ${JSON_SQL_TYPE},
        "batchId" ${STRING_SQL_TYPE} NULL,

        PRIMARY KEY("insertionId", "subscriptionId")
      );

      CREATE TABLE IF NOT EXISTS ${subscribersTableNameAsId}(
        "subscriptionId" ${STRING_SQL_TYPE} NOT NULL,
        "eventSubscriber" ${STRING_SQL_TYPE} NOT NULL,
        "status" ${STRING_SQL_TYPE} NOT NULL,
        "deliveryStrategy" ${STRING_SQL_TYPE} NOT NULL,
        "eventTypes" ${JSON_SQL_TYPE} NOT NULL,
        "aggregateIds" ${JSON_SQL_TYPE} NOT NULL,
        "queueStrategy" ${STRING_SQL_TYPE} NOT NULL,
        "maxParallel" ${LONG_INTEGER_SQL_TYPE} NOT NULL,
        "properties" ${JSON_SQL_TYPE},
        
        "successEvent" ${JSON_SQL_TYPE},
        "failedEvent" ${JSON_SQL_TYPE},
        "errors" ${JSON_SQL_TYPE},
        "cursor" ${JSON_SQL_TYPE},
        
        PRIMARY KEY("subscriptionId")
      );
      
      CREATE TABLE IF NOT EXISTS ${batchesTableNameAsId}(
        "batchId" ${STRING_SQL_TYPE} NOT NULL,
        "eventIndex" ${INTEGER_SQL_TYPE} NOT NULL,
        "aggregateIdAndVersion" ${STRING_SQL_TYPE} NOT NULL,
        "threadId" ${LONG_INTEGER_SQL_TYPE} NOT NULL,
        "threadCounter" ${LONG_INTEGER_SQL_TYPE} NOT NULL,

        PRIMARY KEY("batchId", "eventIndex")
      );
      
      CREATE INDEX IF NOT EXISTS ${notificationsSubscriptionIdIndexNameAsId}
      ON ${notificationsTableNameAsId}("subscriptionId");

      CREATE INDEX IF NOT EXISTS ${notificationsBatchIdIndexNameAsId}
      ON ${notificationsTableNameAsId}("batchId");

      CREATE UNIQUE INDEX IF NOT EXISTS ${subscribersEventSubscriberIndexNameAsId}
      ON ${subscribersTableNameAsId}("eventSubscriber");

      CREATE INDEX IF NOT EXISTS ${batchesBatchIdIndexNameAsId}
      ON ${batchesTableNameAsId}("batchId");
      
      COMMIT;
      BEGIN IMMEDIATE;
    `);
  } catch (error) {
    if (
      error != null &&
      /^SQLITE_ERROR:.*? already exists$/.test(error.message)
    ) {
      throw new ResourceAlreadyExistError(
        `Double-initialize event-bus database failed`
      );
    } else {
      throw error;
    }
  }
}

export default createDatabase;
