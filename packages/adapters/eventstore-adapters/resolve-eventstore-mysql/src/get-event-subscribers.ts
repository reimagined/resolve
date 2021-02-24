import { AdapterPool } from './types'

const getEventSubscribers = async (pool: AdapterPool): Promise<Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any
  }>> => {
  const { subscribersTableName, connection, escapeId } = pool
  const subscribersTableNameAsId = escapeId(subscribersTableName)  

  const rows = (await connection.query(`
    SELECT * FROM ${subscribersTableNameAsId}
  `))[0] as Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any
  }>

  return rows
}

export default getEventSubscribers
