import { SUBSCRIBERS_TABLE_NAME } from '../constants'

const status = async (pool, payload) => {
  const {
    database: { runQuery, escapeId, escapeStr },
    parseSubscription,
  } = pool

  const { eventSubscriber } = payload
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const result = await runQuery(`
    SELECT * FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
  `)

  if (result == null || result.length !== 1) {
    throw new Error('Invalid subscriber')
  }

  return parseSubscription(result[0])
}

export default status
