import { AdapterPool } from './types'

const hasEvents = async (pool: AdapterPool, events: any[]): Promise<any> => {
  const {
    executeStatement,
    escapeId,
    escape,
    eventsTableName,
    databaseName,
  } = pool
  if (!Array.isArray(events) || events.length === 0) {
    return []
  }

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableAsId = escapeId(eventsTableName)

  const rows = await executeStatement(
    `SELECT "aggregateId", "aggregateVersion" FROM ${databaseNameAsId}.${eventsTableAsId} 
    WHERE ${events
      .map(
        ({ aggregateId, aggregateVersion }) =>
          `( "aggregateId" = ${escape(
            aggregateId
          )} AND "aggregateVersion" = ${escape(aggregateVersion)} )`
      )
      .join(' OR ')}`
  )

  const resultSet = new Set()
  for (const { aggregateId, aggregateVersion } of rows) {
    resultSet.add(`${aggregateId}-${aggregateVersion}`)
  }

  const result = events.map(({ aggregateId, aggregateVersion }) =>
    resultSet.has(`${aggregateId}-${aggregateVersion}`)
  )

  return result
}

export default hasEvents
