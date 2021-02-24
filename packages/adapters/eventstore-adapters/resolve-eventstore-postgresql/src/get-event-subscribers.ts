import { AdapterPool } from './types'

const getEventSubscribers = async (pool: AdapterPool): Promise<Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any
  status: any
}>> => {
  const { subscribersTableName, databaseName, executeStatement, escapeId } = pool
  const databaseNameAsId = escapeId(databaseName)
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  const rows = await executeStatement(`
    SELECT * FROM ${databaseNameAsId}.${subscribersTableNameAsId}
  `) as Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any,
  status: any
  }>

  return rows
}

export default getEventSubscribers
