import { AdapterPool } from './types'

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
  const {
    subscribersTableName,
    databaseName,
    executeStatement,
    escapeId,
    escape,
  } = pool
  const databaseNameAsId = escapeId(databaseName)
  const subscribersTableNameAsId = escapeId(subscribersTableName)
  if (
    (!!updateOnly && destination != null) ||
    (!updateOnly && destination == null)
  ) {
    throw new Error(
      `Parameters "destination" and "updateOnly" are mutual exclusive`
    )
  }

  try {
    await executeStatement(`
      WITH "CTE" AS (${
        updateOnly
          ? `SELECT '' AS "SubscriberCheck" WHERE (
          (SELECT 1 AS "SubscriberNotFound")
        UNION ALL
          (SELECT 1 AS "SubscriberNotFound"
          FROM "information_schema"."tables"
          WHERE (
            SELECT Count(*) FROM ${databaseNameAsId}.${subscribersTableNameAsId}
            WHERE "applicationName" = ${escape(applicationName)}
            AND "eventSubscriber" = ${escape(eventSubscriber)}
          ) = 0)
        ) = 1`
          : `SELECT '' AS "SubscriberCheck"`
      }
      ) INSERT INTO ${databaseNameAsId}.${subscribersTableNameAsId}(
        "applicationName",
        "eventSubscriber",
        "destination",
        "status"
      ) VALUES (
        ${escape(
          applicationName
        )} || (SELECT "CTE"."SubscriberCheck" FROM "CTE"),
        ${escape(eventSubscriber)},
        ${!updateOnly ? `${escape(JSON.stringify(destination))}` : `'null'`},
        ${escape(JSON.stringify(status))}
      )
      ON CONFLICT ("applicationName", "eventSubscriber") DO UPDATE SET
      ${
        !updateOnly
          ? `"destination" = ${escape(JSON.stringify(destination))},`
          : ''
      }
      "status" = ${escape(JSON.stringify(status))}
    `)
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''
    if (errorMessage.indexOf('subquery used as an expression') > -1) {
      return false
    }

    throw error
  }

  return true
}

export default ensureEventSubscriber
