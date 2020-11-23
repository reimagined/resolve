const serializeError = (error) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const MAX_SEIZE_TIME = 1500 // 1.5 seconds

const buildInit = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    eventstoreAdapter,
    escape,
    ledgerTableNameAsId,
    xaKey,
  } = pool

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])
  try {
    while (true) {
      try {
        await inlineLedgerRunQuery(
          `BEGIN EXCLUSIVE;
          SAVEPOINT ROOT;

          SELECT ABS("CTE"."XaKeyIsSeized") FROM (
            SELECT 0 AS "XaKeyIsSeized"
          UNION ALL
            SELECT -9223372036854775808 AS "XaKeyIsSeized"
            FROM "sqlite_master"
            WHERE (
              SELECT Count(*) FROM ${ledgerTableNameAsId}
              WHERE "EventSubscriber" = ${escape(readModelName)}
              AND "XaKey" = ${escape(xaKey)}
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
      }
    }

    if (typeof projection.Init === 'function') {
      await projection.Init(store)
    }

    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
       SET "SuccessEvent" = ${escape(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escape(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escape(readModelName)};

       COMMIT;
      `,
      true
    )

    await next()
  } catch (error) {
    if (error instanceof PassthroughError) {
      throw error
    }

    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
       SET "Errors" = JSON_insert(
         COALESCE("Errors", JSON('[]')),
         '$[' || JSON_ARRAY_LENGTH(COALESCE("Errors", JSON('[]'))) || ']',
         JSON(${escape(JSON.stringify(serializeError(error)))})
       ),
       "FailedEvent" = ${escape(JSON.stringify({ type: 'Init' }))},
       "Cursor" = ${escape(JSON.stringify(nextCursor))}
       WHERE "EventSubscriber" = ${escape(readModelName)};

       COMMIT;
      `,
      true
    )
  }
}

const buildEvents = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    getVacantTimeInMillis,
    inlineLedgerRunQuery,
    eventstoreAdapter,
    escape,
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
    .then((result) => (result != null ? result.events : null))

  if (events.length === 0) {
    throw new PassthroughError()
  }
  const seizeTimestamp = Date.now()

  while (true) {
    try {
      await inlineLedgerRunQuery(
        `BEGIN EXCLUSIVE;
        SAVEPOINT ROOT;

        SELECT ABS("CTE"."XaKeyIsSeized") FROM (
          SELECT 0 AS "XaKeyIsSeized"
        UNION ALL
          SELECT -9223372036854775808 AS "XaKeyIsSeized"
          FROM "sqlite_master"
          WHERE (
            SELECT Count(*) FROM ${ledgerTableNameAsId}
            WHERE "EventSubscriber" = ${escape(readModelName)}
            AND "XaKey" = ${escape(xaKey)}
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
    }
  }

  let nextCursor = eventstoreAdapter.getNextCursor(cursor, events)
  let appliedEventsCount = 0
  try {
    for (const event of events) {
      try {
        if (typeof projection[event.type] === 'function') {
          await inlineLedgerRunQuery(`SAVEPOINT E${appliedEventsCount}`, true)
          await projection[event.type](store, event)
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
            ? `"SuccessEvent" = ${escape(JSON.stringify(lastSuccessEvent))},`
            : ''
        } 
        "Cursor" = ${escape(JSON.stringify(nextCursor))}
        WHERE "EventSubscriber" = ${escape(readModelName)};

        COMMIT;
      `,
      true
    )
  } else {
    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
        SET "Errors" = JSON_insert(
          COALESCE("Errors", JSON('[]')),
          '$[' || JSON_ARRAY_LENGTH(COALESCE("Errors", JSON('[]'))) || ']',
          JSON(${escape(JSON.stringify(serializeError(lastError)))})
        ),
        ${
          lastFailedEvent != null
            ? `"FailedEvent" = ${escape(JSON.stringify(lastFailedEvent))},`
            : ''
        }
        ${
          lastSuccessEvent != null
            ? `"SuccessEvent" = ${escape(JSON.stringify(lastSuccessEvent))},`
            : ''
        }
        "Cursor" = ${escape(JSON.stringify(nextCursor))}
        WHERE "EventSubscriber" = ${escape(readModelName)};

        COMMIT;
      `,
      true
    )
  }

  const isBuildSuccess = lastError == null && appliedEventsCount > 0
  if (isBuildSuccess) {
    await next()
  }
}

const build = async (
  basePool,
  readModelName,
  store,
  projection,
  next,
  getVacantTimeInMillis,
  provideLedger
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    generateGuid,
    attendedReadModels,
    connectionUri,
    tablePrefix,
    escapeId,
    escape,
  } = basePool
  const pool = Object.create(basePool)

  const eagerSeizeMode =
    (!attendedReadModels.has(connectionUri)
      ? attendedReadModels.set(connectionUri, new Set())
      : attendedReadModels
    )
      .get(connectionUri)
      .add(readModelName).size > 1

  try {
    const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
    const xaKey = generateGuid(`${Date.now()}${Math.random()}${process.pid}`)

    while (true) {
      let isReadSuccess = false
      try {
        await inlineLedgerRunQuery(
          `SELECT 0 AS "Defunct" FROM ${ledgerTableNameAsId}
          WHERE "EventSubscriber" = ${escape(readModelName)}
          `
        )
        isReadSuccess = true

        await inlineLedgerRunQuery(
          `BEGIN EXCLUSIVE;
           UPDATE ${ledgerTableNameAsId}
           SET "XaKey" = ${escape(xaKey)}
           WHERE "EventSubscriber" = ${escape(readModelName)}
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
        if (!isReadSuccess && !eagerSeizeMode) {
          throw new PassthroughError()
        }
      }
    }

    const rows = await inlineLedgerRunQuery(
      `SELECT * FROM ${ledgerTableNameAsId}
      WHERE "EventSubscriber" = ${escape(readModelName)}
      AND "IsPaused" = 0
      AND "Errors" IS NULL
      `
    )

    await inlineLedgerRunQuery(`COMMIT; `, true)

    const readModelLedger =
      rows.length === 1
        ? {
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
            Properties:
              rows[0].Properties != null
                ? JSON.parse(rows[0].Properties)
                : null,
            Schema: rows[0].Schema != null ? JSON.parse(rows[0].Schema) : null,
          }
        : null

    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError()
    }

    const { EventTypes: eventTypes, Cursor: cursor } = readModelLedger

    if (!Array.isArray(eventTypes) && eventTypes != null) {
      throw new TypeError('eventTypes')
    }

    if (cursor != null && cursor.constructor !== String) {
      throw new TypeError('cursor')
    }

    await provideLedger(readModelLedger)

    Object.assign(pool, {
      getVacantTimeInMillis,
      ledgerTableNameAsId,
      readModelLedger,
      eventTypes,
      cursor,
      xaKey,
    })

    const buildMethod = cursor == null ? buildInit : buildEvents
    await buildMethod(pool, readModelName, store, projection, next)
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
  }
}

export default build
