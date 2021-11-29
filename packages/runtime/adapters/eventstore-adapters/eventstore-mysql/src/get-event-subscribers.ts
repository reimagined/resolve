import { AdapterPool } from './types'

const getEventSubscribers = async (
  pool: AdapterPool,
  {
    applicationName,
    eventSubscriber,
  }:
    | {
        applicationName?: string
        eventSubscriber?: string
      }
    | undefined = {}
): Promise<
  Array<{
    applicationName: string
    eventSubscriber: string
    destination: any
    status: any
  }>
> => {
  const { subscribersTableName, escapeId, escape } = pool
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  const rows = (
    await pool.query(`
    SELECT * FROM ${subscribersTableNameAsId}
    ${
      applicationName != null || eventSubscriber != null
        ? `
    WHERE ${
      applicationName != null
        ? `\`applicationName\` = ${escape(applicationName)}`
        : ''
    }
    ${applicationName != null && eventSubscriber != null ? ' AND ' : ''}
    ${
      eventSubscriber != null
        ? `\`eventSubscriber\` = ${escape(eventSubscriber)}`
        : ''
    }
    `
        : ''
    }
  `)
  )[0] as Array<{
    applicationName: string
    eventSubscriber: string
    destination: any
    status: any
  }>

  return rows
}

export default getEventSubscribers
