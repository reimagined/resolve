import { AdapterPool } from './types'

const getEventSubscribers = async (pool: AdapterPool): Promise<Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any,
  status: any
  }>> => {
  const { subscribersTableName, database, escapeId } = pool
  const subscribersTableNameAsId = escapeId(subscribersTableName)  

  const rows = await database.all(`
    SELECT * FROM ${subscribersTableNameAsId}
  `) as Array<{
  applicationName: string,
  eventSubscriber: string, 
  destination: any,
  status: any
  }>

  return rows
}

export default getEventSubscribers
