import createQuery from './create-query'

const getLatestEvent = async (pool, filter) => {
  const { database, tableName, escapeId } = pool

  const resultQueryCondition = createQuery(pool, filter)

  const rows = await database.all(
    `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
    ORDER BY ${escapeId('timestamp')} DESC
    LIMIT 0, 1`
  )

  if (rows.length > 0) {
    const event = rows[0]
    event.payload = JSON.parse(event.payload)

    delete event.threadId
    delete event.threadCounter

    return event
  }

  return null
}

export default getLatestEvent
