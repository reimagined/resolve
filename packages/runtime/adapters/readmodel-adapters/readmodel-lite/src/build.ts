import type { ExternalMethods, ReadModelCursor, ReadModelLedger } from './types'

const serializeError = (error: Error & { code: number }) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const MAX_SEIZE_TIME = 1500 // 1.5 seconds

const buildInit: (
  currentPool: {
    ledgerTableNameAsId: string
    xaKey: string
    eventTypes: Array<string> | null
    cursor: ReadModelCursor
    readModelLedger: ReadModelLedger
  },
  ...args: Parameters<ExternalMethods['build']>
) => ReturnType<ExternalMethods['build']> = async (
  currentPool,
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter
) => {
  const pool = { ...basePool, ...currentPool }
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    fullJitter,
    escapeStr,
    ledgerTableNameAsId,
    xaKey,
  } = pool

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])
  for (let retry = 0; ; retry++) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN IMMEDIATE;
          SAVEPOINT ROOT;

          SELECT ABS("CTE"."XaKeyIsSeized") FROM (
            SELECT 0 AS "XaKeyIsSeized"
          UNION ALL
            SELECT -9223372036854775808 AS "XaKeyIsSeized"
            FROM "sqlite_master"
            WHERE (
              SELECT Count(*) FROM ${ledgerTableNameAsId}
              WHERE "EventSubscriber" = ${escapeStr(readModelName)}
              AND "XaKey" = ${escapeStr(xaKey)}
              AND "IsPaused" = 0
              AND "Errors" IS NULL
            ) = 0
          ) CTE;
          `,
        true,
        true
      )
      break
    } catch (error) {
      if (!(error instanceof PassthroughError) || error.isRuntimeError) {
        throw error
      }

      try {
        await inlineLedgerRunQuery(`ROLLBACK`, true)
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }

      await fullJitter(retry)
    }
  }

  let lastError = null
  try {
    const handler = await modelInterop.acquireInitHandler(store)
    if (handler != null) {
      await handler()
    }
  } catch (error) {
    lastError = error
  }

  if (lastError == null) {
    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
        SET "SuccessEvent" = ${escapeStr(JSON.stringify({ type: 'Init' }))},
        "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)};
        `,
      true
    )
  } else {
    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
        SET "Errors" = JSON_insert(
          COALESCE("Errors", JSON('[]')),
          '$[' || JSON_ARRAY_LENGTH(COALESCE("Errors", JSON('[]'))) || ']',
          JSON(${escapeStr(JSON.stringify(serializeError(lastError)))})
        ),
        "FailedEvent" = ${escapeStr(JSON.stringify({ type: 'Init' }))},
        "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)};
        `,
      true
    )
  }

  while (true) {
    try {
      await inlineLedgerRunQuery(`COMMIT;`, true)
      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      await fullJitter(0)
    }
  }

  if (lastError == null) {
    await next()
  }
}

const buildEvents: (
  currentPool: {
    ledgerTableNameAsId: string
    xaKey: string
    eventTypes: Array<string> | null
    cursor: ReadModelCursor
    readModelLedger: ReadModelLedger
  },
  ...args: Parameters<ExternalMethods['build']>
) => ReturnType<ExternalMethods['build']> = async (
  currentPool,
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis
) => {
  const pool = { ...basePool, ...currentPool }
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    fullJitter,
    escapeStr,
    ledgerTableNameAsId,
    eventTypes,
    cursor,
    xaKey,
  } = pool

  let lastSuccessEvent = null
  let lastFailedEvent = null
  let lastError = null

  const events = await eventstoreAdapter
    .loadEvents({
      eventTypes,
      eventsSizeLimit: 6553600,
      limit: 100,
      cursor,
    })
    .then((result) => (result != null ? result.events : []))

  if (events.length === 0) {
    throw new PassthroughError(false)
  }
  const seizeTimestamp = Date.now()

  for (let retry = 0; ; retry++) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN IMMEDIATE;
        SAVEPOINT ROOT;

        SELECT ABS("CTE"."XaKeyIsSeized") FROM (
          SELECT 0 AS "XaKeyIsSeized"
        UNION ALL
          SELECT -9223372036854775808 AS "XaKeyIsSeized"
          FROM "sqlite_master"
          WHERE (
            SELECT Count(*) FROM ${ledgerTableNameAsId}
            WHERE "EventSubscriber" = ${escapeStr(readModelName)}
            AND "XaKey" = ${escapeStr(xaKey)}
            AND "IsPaused" = 0
            AND "Errors" IS NULL
          ) = 0
        ) CTE;
        `,
        true,
        true
      )
      break
    } catch (error) {
      if (!(error instanceof PassthroughError) || error.isRuntimeError) {
        throw error
      }

      try {
        await inlineLedgerRunQuery(`ROLLBACK`, true)
      } catch (err) {
        if (!(err instanceof PassthroughError)) {
          throw err
        }
      }

      await fullJitter(retry)
    }
  }

  let nextCursor:
    | Promise<ReadModelCursor>
    | ReadModelCursor = eventstoreAdapter.getNextCursor(cursor, events)
  let appliedEventsCount = 0
  try {
    for (const event of events) {
      try {
        const handler = await modelInterop.acquireEventHandler(store, event)
        if (handler != null) {
          await inlineLedgerRunQuery(`SAVEPOINT E${appliedEventsCount}`, true)
          await handler()
          await inlineLedgerRunQuery(
            `RELEASE SAVEPOINT E${appliedEventsCount}`,
            true
          )
          lastSuccessEvent = event
        }
        appliedEventsCount++

        if (
          Date.now() - seizeTimestamp > MAX_SEIZE_TIME ||
          getVacantTimeInMillis() < 0
        ) {
          nextCursor = eventstoreAdapter.getNextCursor(
            cursor,
            events.slice(0, appliedEventsCount)
          )
          break
        }
      } catch (error) {
        if (error instanceof PassthroughError) {
          throw error
        }

        nextCursor = eventstoreAdapter.getNextCursor(
          cursor,
          events.slice(0, appliedEventsCount)
        )

        await inlineLedgerRunQuery(
          `ROLLBACK TO SAVEPOINT E${appliedEventsCount};
            RELEASE SAVEPOINT E${appliedEventsCount}
        `,
          true
        )

        lastFailedEvent = event
        lastError = error
        break
      }
    }
  } catch (originalError) {
    if (originalError instanceof PassthroughError) {
      throw originalError
    }

    nextCursor = cursor
    appliedEventsCount = 0
    const composedError = new Error(
      `Fatal inline ledger building error: ${originalError.message}`
    )
    composedError.stack = `${composedError.stack}${originalError.stack}`
    lastError = composedError
    lastSuccessEvent = null
    lastFailedEvent = null
    await inlineLedgerRunQuery(
      `ROLLBACK TO SAVEPOINT ROOT;
        RELEASE SAVEPOINT ROOT
    `,
      true
    )
  }

  if (lastError == null) {
    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId} SET 
        ${
          lastSuccessEvent != null
            ? `"SuccessEvent" = ${escapeStr(JSON.stringify(lastSuccessEvent))},`
            : ''
        } 
        "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)};
      `,
      true
    )
  } else {
    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
        SET "Errors" = JSON_insert(
          COALESCE("Errors", JSON('[]')),
          '$[' || JSON_ARRAY_LENGTH(COALESCE("Errors", JSON('[]'))) || ']',
          JSON(${escapeStr(JSON.stringify(serializeError(lastError)))})
        ),
        ${
          lastFailedEvent != null
            ? `"FailedEvent" = ${escapeStr(JSON.stringify(lastFailedEvent))},`
            : ''
        }
        ${
          lastSuccessEvent != null
            ? `"SuccessEvent" = ${escapeStr(JSON.stringify(lastSuccessEvent))},`
            : ''
        }
        "Cursor" = ${escapeStr(JSON.stringify(nextCursor))}
        WHERE "EventSubscriber" = ${escapeStr(readModelName)};
      `,
      true
    )
  }

  while (true) {
    try {
      await inlineLedgerRunQuery(`COMMIT;`, true)
      break
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }

      await fullJitter(0)
    }
  }

  const isBuildSuccess = lastError == null && appliedEventsCount > 0
  if (isBuildSuccess) {
    await next()
  }
}

const build: ExternalMethods['build'] = async (
  basePool,
  readModelName,
  store,
  modelInterop,
  next,
  eventstoreAdapter,
  getVacantTimeInMillis
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    generateGuid,
    fullJitter,
    tablePrefix,
    escapeId,
    escapeStr,
  } = basePool

  try {
    basePool.activePassthrough = true
    const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
    const xaKey = generateGuid(`${Date.now()}${Math.random()}${process.pid}`)

    for (let retry = 0; ; retry++) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN IMMEDIATE;
           UPDATE ${ledgerTableNameAsId}
           SET "XaKey" = ${escapeStr(xaKey)}
           WHERE "EventSubscriber" = ${escapeStr(readModelName)}
           AND "IsPaused" = FALSE
           AND "Errors" IS NULL;
          `,
          true
        )
        break
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }

        try {
          await inlineLedgerRunQuery(`ROLLBACK`, true)
        } catch (err) {
          if (!(err instanceof PassthroughError)) {
            throw err
          }
        }

        await fullJitter(retry)
      }
    }

    const rows = (await inlineLedgerRunQuery(
      `SELECT * FROM ${ledgerTableNameAsId}
      WHERE "EventSubscriber" = ${escapeStr(readModelName)}
      AND "IsPaused" = 0
      AND "Errors" IS NULL
      `
    )) as Array<{
      EventTypes: string | null
      AggregateIds: string | null
      Cursor: string | null
      SuccessEvent: string | null
      FailedEvent: string | null
      Errors: string | null
      Schema: string | null
    }>

    while (true) {
      try {
        await inlineLedgerRunQuery(`COMMIT; `, true)
        break
      } catch (error) {
        if (!(error instanceof PassthroughError)) {
          throw error
        }

        await fullJitter(0)
      }
    }

    const readModelLedger =
      rows.length === 1
        ? ({
            EventTypes:
              rows[0].EventTypes != null
                ? JSON.parse(rows[0].EventTypes)
                : null,
            AggregateIds:
              rows[0].AggregateIds != null
                ? JSON.parse(rows[0].AggregateIds)
                : null,
            Cursor: rows[0].Cursor != null ? JSON.parse(rows[0].Cursor) : null,
            SuccessEvent:
              rows[0].SuccessEvent != null
                ? JSON.parse(rows[0].SuccessEvent)
                : null,
            FailedEvent:
              rows[0].FailedEvent != null
                ? JSON.parse(rows[0].FailedEvent)
                : null,
            Errors: rows[0].Errors != null ? JSON.parse(rows[0].Errors) : null,
            Schema: rows[0].Schema != null ? JSON.parse(rows[0].Schema) : null,
          } as ReadModelLedger)
        : null

    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError(false)
    }

    const { EventTypes: eventTypes, Cursor: cursor } = readModelLedger

    if (!Array.isArray(eventTypes) && eventTypes != null) {
      throw new TypeError('eventTypes')
    }

    if (cursor != null && cursor.constructor !== String) {
      throw new TypeError('cursor')
    }

    const currentPool = {
      ledgerTableNameAsId,
      readModelLedger,
      eventTypes,
      cursor,
      xaKey,
    }

    const buildMethod = cursor == null ? buildInit : buildEvents
    await buildMethod(
      currentPool,
      basePool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis
    )
  } catch (error) {
    if (!(error instanceof PassthroughError)) {
      throw error
    }

    try {
      await inlineLedgerRunQuery(`ROLLBACK`, true)
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  } finally {
    basePool.activePassthrough = false
  }
}

export default build
