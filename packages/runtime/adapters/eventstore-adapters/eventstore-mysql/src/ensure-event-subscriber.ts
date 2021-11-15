import { AdapterPool } from './types'
import { ER_SUBQUERY_NO_1_ROW } from './constants'

const ensureEventSubscriber = async (
  pool: AdapterPool,
  params: {
    applicationName: string
    eventSubscriber: string
    destination?: any
    status?: any
    updateOnly?: boolean
  }
): Promise<boolean> => {
  const {
    applicationName,
    eventSubscriber,
    destination,
    status,
    updateOnly,
  } = params
  const { subscribersTableName, query, escapeId, escape } = pool
  const subscribersTableNameAsId = escapeId(subscribersTableName)
  if (
    (!!updateOnly && destination != null) ||
    (!updateOnly && destination == null)
  ) {
    throw new Error(
      `Parameters "destination" and "updateOnly" are mutually exclusive`
    )
  }

  try {
    await query(`
      START TRANSACTION;
      ${
        updateOnly
          ? `SELECT 1 FROM \`information_schema\`.\`tables\`
      WHERE (
        SELECT 0 AS \`SubscriberNotFound\`
      UNION ALL
        SELECT 0 AS \`SubscriberNotFound\`
        FROM \`information_schema\`.\`tables\` \`INF\`
        WHERE (
          SELECT Count(*) FROM ${subscribersTableNameAsId}
          WHERE \`applicationName\` = ${escape(applicationName)}
          AND \`eventSubscriber\` = ${escape(eventSubscriber)}
        ) = 0
      ) = 0;`
          : ''
      }

      INSERT INTO ${subscribersTableNameAsId}(
        \`applicationName\`,
        \`eventSubscriber\`,
        ${!updateOnly ? `\`destination\`,` : ''}
        \`status\`
      )
      VALUES(
        ${escape(applicationName)},
        ${escape(eventSubscriber)},
        ${
          !updateOnly
            ? `(CAST(${escape(JSON.stringify(destination))} AS JSON)), `
            : ''
        }
        (CAST(${escape(JSON.stringify(status))} AS JSON))
      )
      ON DUPLICATE KEY UPDATE 
      ${
        !updateOnly
          ? `\`destination\` = (CAST(${escape(
              JSON.stringify(destination)
            )} AS JSON)), `
          : ''
      }
      \`status\` = (CAST(${escape(JSON.stringify(status))} AS JSON));

      COMMIT;
    `)
  } catch (error) {
    try {
      await query('ROLLBACK')
    } catch (err) {}

    const errno = error != null && error.errno != null ? error.errno : 0
    if (errno === ER_SUBQUERY_NO_1_ROW) {
      return false
    }

    throw error
  }

  return true
}

export default ensureEventSubscriber
