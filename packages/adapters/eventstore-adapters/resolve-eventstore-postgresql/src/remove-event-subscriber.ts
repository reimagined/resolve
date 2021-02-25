import { AdapterPool } from './types'

const removeEventSubscriber = async (
  pool: AdapterPool,
  params: {
    applicationName: string
    eventSubscriber: string
  }
): Promise<void> => {
  const {
    subscribersTableName,
    databaseName,
    executeStatement,
    escapeId,
    escape,
  } = pool
  const { applicationName, eventSubscriber } = params
  const databaseNameAsId = escapeId(databaseName)
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  await executeStatement(`
    DELETE FROM ${databaseNameAsId}.${subscribersTableNameAsId}
    WHERE "applicationName" = ${escape(applicationName)}
    AND "eventSubscriber" = ${escape(eventSubscriber)}
  `)
}

export default removeEventSubscriber
