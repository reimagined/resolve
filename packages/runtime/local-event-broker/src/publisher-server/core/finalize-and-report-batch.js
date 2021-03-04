import {
  BATCHES_TABLE_NAME,
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  PrivateOperationType,
  LazinessStrategy,
  SUBSCRIBERS_TABLE_NAME,
  SubscriptionStatus,
} from '../constants'

const finalizeAndReportBatch = async (pool, payload) => {
  const {
    database: { escapeId, escapeStr, runQuery, runRawQuery },
    invokeOperation,
  } = pool

  const { activeBatch, result } = payload
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  const { batchId, subscriptionId, eventSubscriber } = activeBatch
  const isActiveResult = result != null && result.constructor === Object
  const updateStatements = []
  if (isActiveResult && Object.keys(result).length > 0) {
    // eslint-disable-next-line prefer-const
    let { successEvent, failedEvent, error, cursor } = result
    if (successEvent == null && failedEvent == null && error == null) {
      error = {
        message: `EventSubscriber ${eventSubscriber} on batchId ${batchId} perform idle operation`,
      }
    }
    const nextStatus =
      error != null ? SubscriptionStatus.ERROR : SubscriptionStatus.DELIVER
    updateStatements.push(`"status" = CASE WHEN "status" = ${escapeStr(
      SubscriptionStatus.ERROR
    )} THEN ${escapeStr(SubscriptionStatus.ERROR)}
    WHEN ${
      nextStatus === SubscriptionStatus.ERROR ? '1 = 1' : '1 = 0'
    } THEN ${escapeStr(SubscriptionStatus.ERROR)}
    WHEN "status" = ${escapeStr(SubscriptionStatus.SKIP)} THEN ${escapeStr(
      SubscriptionStatus.SKIP
    )}
    ELSE ${escapeStr(SubscriptionStatus.DELIVER)}
    END`)
    if (successEvent != null) {
      updateStatements.push(
        `"successEvent" = json(${escapeStr(JSON.stringify(successEvent))})`
      )
    }
    if (failedEvent != null) {
      updateStatements.push(
        `"failedEvent" = json(${escapeStr(JSON.stringify(failedEvent))})`
      )
    }
    if (error != null) {
      updateStatements.push(`"errors" = json_insert(
        COALESCE("errors", json('[]')),
        '$[' || json_array_length(COALESCE("errors", json('[]'))) || ']',
        json(${escapeStr(JSON.stringify(error))})
      )`)
    }
    if (cursor != null) {
      updateStatements.push(
        `"cursor" = json(${escapeStr(JSON.stringify(cursor))})`
      )
    }
  } else if (isActiveResult) {
    throw new Error('Delivery result should not be empty object')
  }
  const notifications = await runQuery(`
      SELECT ${notificationsTableNameAsId}.*,
      CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE}) AS "processEndTimestamp"
      FROM ${notificationsTableNameAsId}
      LIMIT 1
    `)

  await runRawQuery(`${
    isActiveResult
      ? `UPDATE ${subscribersTableNameAsId} SET
      ${updateStatements.join(', ')}
      WHERE "subscriptionId" = ${escapeStr(subscriptionId)};`
      : ''
  }
    
      DELETE FROM ${batchesTableNameAsId}
      WHERE "batchId" = ${escapeStr(batchId)};
    
      DELETE FROM ${notificationsTableNameAsId}
      WHERE "batchId" = ${escapeStr(batchId)};

      COMMIT;
      BEGIN IMMEDIATE;
    `)

  // TODO: Report Statistics for notifications
  void notifications

  if (
    result != null &&
    result.successEvent != null &&
    result.failedEvent == null &&
    result.error == null
  ) {
    const input = {
      type: PrivateOperationType.RESUME_SUBSCRIBER,
      payload: {
        eventSubscriber,
        conditionalResume: true,
      },
    }
    await invokeOperation(pool, LazinessStrategy.EAGER, input)
  }
}

export default finalizeAndReportBatch
