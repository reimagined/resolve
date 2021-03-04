import { AdapterPool } from './types'

const removeEventSubscriber = async (
  pool: AdapterPool,
  params: {
    applicationName: string
    eventSubscriber: string
  }
): Promise<void> => {
  const { subscribersTableName, connection, escapeId, escape } = pool
  const { applicationName, eventSubscriber } = params
  const subscribersTableNameAsId = escapeId(subscribersTableName)

  await connection.query(`
    DELETE FROM ${subscribersTableNameAsId}
    WHERE \`applicationName\` = ${escape(applicationName)}
    AND \`eventSubscriber\` = ${escape(eventSubscriber)}
  `)
}

export default removeEventSubscriber
