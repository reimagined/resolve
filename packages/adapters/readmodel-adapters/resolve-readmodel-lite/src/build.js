const serializeError = (error) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const RESERVED_TIME = 30 * 1000

const buildInit = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    eventstoreAdapter,
    escape,
    ledgerTableNameAsId,
  } = pool

  await inlineLedgerRunQuery(
    `BEGIN IMMEDIATE;
     SAVEPOINT ROOT;
    `,
    true
  )

  const nextCursor = await eventstoreAdapter.getNextCursor(null, [])
  try {
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
    getRemainingTimeInMillis,
    inlineLedgerRunQuery,
    eventstoreAdapter,
    escape,
    ledgerTableNameAsId,
    eventTypes,
    cursor: inputCursor,
  } = pool

  let lastSuccessEvent = null
  let lastFailedEvent = null
  let lastError = null
  let cursor = inputCursor

  const events = await eventstoreAdapter
    .loadEvents({
      eventTypes,
      eventsSizeLimit: 6553600,
      limit: 100,
      cursor,
    })
    .then((result) => (result != null ? result.events : null))

  await inlineLedgerRunQuery(
    `BEGIN IMMEDIATE;
     SAVEPOINT ROOT;
    `,
    true
  )

  while (true) {
    if (events.length === 0) {
      throw new PassthroughError()
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

          if (getRemainingTimeInMillis() < RESERVED_TIME) {
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
    cursor = nextCursor

    if (isBuildSuccess) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      await next()
    }

    throw new PassthroughError()
  }
}

const build = async (
  basePool,
  readModelName,
  store,
  projection,
  next,
  getRemainingTimeInMillis
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escape,
  } = basePool
  const pool = Object.create(basePool)

  try {
    const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)

    const rows = await inlineLedgerRunQuery(
      `SELECT * FROM ${ledgerTableNameAsId}
      WHERE "EventSubscriber" = ${escape(readModelName)}
      AND "IsPaused" = 0
      AND "Errors" IS NULL
      `
    )

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

    Object.assign(pool, {
      getRemainingTimeInMillis,
      ledgerTableNameAsId,
      readModelLedger,
      eventTypes,
      cursor,
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
