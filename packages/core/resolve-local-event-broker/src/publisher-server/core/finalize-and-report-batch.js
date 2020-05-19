import {
  BATCHES_TABLE_NAME,
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  STATUS_DELIVER,
  STATUS_SKIP,
  STATUS_ERROR,
  NOTIFICATION_UPDATE_SYMBOL
} from '../constants'

const finalizeAndReportBatch = async (
  pool,
  subscriptionDescription,
  nextStatus,
  rawResult
) => {
  if (
    nextStatus !== STATUS_DELIVER &&
    nextStatus !== STATUS_SKIP &&
    nextStatus !== STATUS_ERROR
  ) {
    throw new Error(`Invalid nextStatus="${nextStatus}"`)
  }
  const {
    database: { escapeId, escapeStr, runQuery, runRawQuery },
    serializeError,
    pushNotificationAndGetSubscriptions,
    pullNotificationsAsBatchForSubscriber,
    multiplexAsync
  } = pool
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  const { batchId, subscriptionId, eventSubscriber } = subscriptionDescription
  const result =
    rawResult != null && rawResult.constructor === Object ? rawResult : {}
  const { successEvent, failedEvent, error: rawError, cursor } = result

  await runRawQuery(`
    UPDATE ${notificationsTableNameAsId} SET
    "processEndTimestamp" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE})
    WHERE "batchId" = ${escapeStr(batchId)};
    COMMIT;
    BEGIN IMMEDIATE;
  `)

  const notifications = await runQuery(`
    SELECT * FROM ${notificationsTableNameAsId}
    WHERE "batchId" = ${escapeStr(batchId)}
  `)
  void notifications

  // TODO: Report Statistics for notifications

  const updateStatements = [
    `"status" = CASE WHEN "status" = ${escapeStr(
      STATUS_ERROR
    )} THEN ${escapeStr(STATUS_ERROR)}
    WHEN ${+(nextStatus === STATUS_ERROR)} THEN ${escapeStr(STATUS_ERROR)}
    WHEN "status" = ${escapeStr(STATUS_SKIP)} THEN ${escapeStr(STATUS_SKIP)}
    ELSE ${escapeStr(STATUS_DELIVER)}
    END`
  ]
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
  if (rawError != null) {
    const error = serializeError(rawError)
    updateStatements.push(`"errors" = json_insert(
      "errors",
      '$[' || json_array_length("errors") || ']',
      json(${escapeStr(JSON.stringify(error))})
    )`)
  }
  if (cursor != null) {
    updateStatements.push(`"cursor" = ${escapeStr(cursor)}`)
  }

  if (updateStatements.length === 0) {
    throw new TypeError()
  }

  await runRawQuery(`
    UPDATE ${subscribersTableNameAsId} SET
    ${updateStatements.join(', ')}
    WHERE "subscriptionId" = ${escapeStr(subscriptionId)};

    DELETE FROM ${notificationsTableNameAsId}
    WHERE "batchId" = ${escapeStr(batchId)};
    
    DELETE FROM ${batchesTableNameAsId}
    WHERE "batchId" = ${escapeStr(batchId)};
    
    COMMIT;
    BEGIN IMMEDIATE;
  `)

  if (
    nextStatus !== STATUS_DELIVER ||
    (successEvent == null && failedEvent == null)
  ) {
    return
  }

  const subscriptionIds = await pushNotificationAndGetSubscriptions(
    pool,
    NOTIFICATION_UPDATE_SYMBOL,
    eventSubscriber
  )

  if (subscriptionIds != null && subscriptionIds.length === 1) {
    multiplexAsync(
      pullNotificationsAsBatchForSubscriber,
      pool,
      subscriptionIds[0]
    )
  }
}

export default finalizeAndReportBatch
