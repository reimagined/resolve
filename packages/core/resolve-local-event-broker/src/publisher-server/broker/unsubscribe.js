import {
  SUBSCRIBERS_TABLE_NAME,
  DeliveryStrategy,
  ConsumerMethod
} from '../constants'

async function unsubscribe(pool, payload) {
  const {
    database: { escapeStr, escapeId, runRawQuery }
  } = pool

  const { eventSubscriber } = payload
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  await runRawQuery(`
    DELETE FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};

    COMMIT;
    BEGIN IMMEDIATE;
  `)
}

export default unsubscribe
