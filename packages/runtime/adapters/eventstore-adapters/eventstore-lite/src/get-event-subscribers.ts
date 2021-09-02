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
  const { subscribersTableName, executeStatement, escapeId, escape } = pool
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  const rows = (await executeStatement(`
    SELECT * FROM ${subscribersTableNameAsId}
    ${
      applicationName != null || eventSubscriber != null
        ? `
    WHERE ${
      applicationName != null
        ? `"applicationName" = ${escape(applicationName)}`
        : ''
    }
    ${applicationName != null && eventSubscriber != null ? ' AND ' : ''}
    ${
      eventSubscriber != null
        ? `"eventSubscriber" = ${escape(eventSubscriber)}`
        : ''
    }
    `
        : ''
    }
  `)) as Array<{
    applicationName: string
    eventSubscriber: string
    destination: any
    status: any
  }>

  return rows.map(
    ({ applicationName, eventSubscriber, destination, status }) => ({
      applicationName,
      eventSubscriber,
      destination: JSON.parse(destination),
      status: JSON.parse(status),
    })
  )
}

export default getEventSubscribers
