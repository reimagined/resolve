import { AdapterPool } from './types'

const getEventSubscribers = async (pool: AdapterPool): Promise<Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any
}>> => {
  const { subscribersTableName, databaseName, executeStatement, escapeId } = pool
  const databaseNameAsId = escapeId(databaseName)
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  const inputRows = await executeStatement(`
    SELECT * FROM ${databaseNameAsId}.${subscribersTableNameAsId}
  `) as Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any
  }>

  const rows = inputRows.map(({ destination, ...rest }) => ({
    destination: JSON.parse(destination),
    ...rest
  }))

  return rows
}

export default getEventSubscribers
