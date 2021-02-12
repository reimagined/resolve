import { EventFilter } from '@reimagined/eventstore-base'
import createQuery from './create-query'
import { AdapterPool } from './types'

const getLatestEvent = async (
  pool: AdapterPool,
  filter: EventFilter
): Promise<any> => {
  const { database, eventsTableName, escapeId, shapeEvent } = pool

  const resultQueryCondition = createQuery(pool, filter)

  const rows = await database.all(
    `SELECT * FROM ${escapeId(eventsTableName)} ${resultQueryCondition}
    ORDER BY ${escapeId('timestamp')} DESC
    LIMIT 0, 1`
  )

  if (rows.length === 0) {
    return null
  }

  return shapeEvent(rows[0])
}

export default getLatestEvent
