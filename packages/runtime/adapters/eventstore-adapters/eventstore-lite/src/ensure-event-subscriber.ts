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
  const { subscribersTableName, database, escapeId, escape } = pool
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
    await database.exec(`
    INSERT OR REPLACE INTO ${subscribersTableNameAsId}(
      "applicationName",
      "eventSubscriber",
      "destination",
      "status"
    ) VALUES(
      ${escape(applicationName)} || ${
      updateOnly
        ? `(SELECT '' FROM "sqlite_master" WHERE EXISTS(
          SELECT ABS("CTE"."SubscriberNotFound") FROM (
        SELECT 0 AS "SubscriberNotFound"
      UNION ALL
        SELECT -9223372036854775808 AS "SubscriberNotFound"
        FROM "sqlite_master"
        WHERE (
          SELECT Count(*) FROM ${subscribersTableNameAsId}
          WHERE "applicationName" = ${escape(applicationName)}
          AND "eventSubscriber" = ${escape(eventSubscriber)}
        ) = 0
      ) CTE
      ) LIMIT 1)`
        : `''`
    },
      ${escape(eventSubscriber)},
      ${
        updateOnly
          ? `(SELECT "destination" FROM ${subscribersTableNameAsId}
        WHERE "applicationName" = ${escape(applicationName)}
        AND "eventSubscriber" = ${escape(eventSubscriber)})`
          : `json(CAST(${escape(JSON.stringify(destination))} AS BLOB))`
      },
      json(CAST(${escape(JSON.stringify(status))} AS BLOB))
    )
    `)
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      return false
    }

    throw error
  }

  return true
}

export default ensureEventSubscriber
