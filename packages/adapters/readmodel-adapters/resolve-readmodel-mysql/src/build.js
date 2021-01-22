const serializeError = (error) =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const buildInit = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    generateGuid,
    eventstoreAdapter,
    escapeStr,
    ledgerTableNameAsId,
    xaKey,
  } = pool

  const rootSavePointId = generateGuid(xaKey, 'ROOT')

  await inlineLedgerRunQuery(
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     START TRANSACTION;
     SAVEPOINT ${rootSavePointId};
     WITH \`CTE\` AS (
      SELECT \`XaKey\` FROM ${ledgerTableNameAsId}
        WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
        AND \`XaKey\` = ${escapeStr(xaKey)}
        AND \`IsPaused\` = FALSE
        AND \`Errors\` IS NULL
        FOR UPDATE NOWAIT
    )
      SELECT 1/Count(\`CTE\`.\`XaKey\`) AS \`NonZero\` FROM \`CTE\`;
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
       SET \`SuccessEvent\` = ${escapeStr(JSON.stringify({ type: 'Init' }))},
       \`Cursor\` = ${escapeStr(JSON.stringify(nextCursor))}
       WHERE \`EventSubscriber\` = ${escapeStr(readModelName)};

       COMMIT;
      `
    )

    await next()
  } catch (error) {
    if (error instanceof PassthroughError) {
      throw error
    }

    await inlineLedgerRunQuery(
      `UPDATE ${ledgerTableNameAsId}
       SET \`Errors\` = JSON_ARRAY_APPEND(COALESCE(\`Errors\`, JSON_ARRAY()), '$',
       CAST(${escapeStr(JSON.stringify(serializeError(error)))} AS JSON)),
       \`FailedEvent\` = ${escapeStr(JSON.stringify({ type: 'Init' }))},
       \`Cursor\` = ${escapeStr(JSON.stringify(nextCursor))}
       WHERE \`EventSubscriber\` = ${escapeStr(readModelName)};

       COMMIT;
      `
    )
  }
}

const buildEvents = async (pool, readModelName, store, projection, next) => {
  const {
    PassthroughError,
    getVacantTimeInMillis,
    getEncryption,
    inlineLedgerRunQuery,
    generateGuid,
    eventstoreAdapter,
    escapeStr,
    ledgerTableNameAsId,
    xaKey,
    eventTypes,
    cursor: inputCursor,
  } = pool

  let lastSuccessEvent = null
  let lastFailedEvent = null
  let lastError = null
  let localContinue = true
  let cursor = inputCursor

  let eventsPromise = eventstoreAdapter
    .loadEvents({
      eventTypes,
      eventsSizeLimit: 6553600,
      limit: 100,
      cursor,
    })
    .then((result) => (result != null ? result.events : null))

  let rootSavePointId = generateGuid(xaKey, 'ROOT')

  await inlineLedgerRunQuery(
    `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
     START TRANSACTION;
     SAVEPOINT ${rootSavePointId};
     WITH \`CTE\` AS (
      SELECT \`XaKey\` FROM ${ledgerTableNameAsId}
        WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
        AND \`XaKey\` = ${escapeStr(xaKey)}
        AND \`IsPaused\` = FALSE
        AND \`Errors\` IS NULL
        FOR UPDATE NOWAIT
    )
      SELECT 1/Count(\`CTE\`.\`XaKey\`) AS \`NonZero\` FROM \`CTE\`;
    `,
    true
  )

  let events = await eventsPromise
  const executeEncryption = await getEncryption()

  while (true) {
    if (events.length === 0) {
      throw new PassthroughError()
    }
    let nextCursor = eventstoreAdapter.getNextCursor(cursor, events)

    eventsPromise = eventstoreAdapter
      .loadEvents({
        eventTypes,
        eventsSizeLimit: 65536000,
        limit: 1000,
        cursor: nextCursor,
      })
      .then((result) => (result != null ? result.events : null))

    let appliedEventsCount = 0
    try {
      for (const event of events) {
        const savePointId = generateGuid(xaKey, `${appliedEventsCount}`)
        try {
          if (typeof projection[event.type] === 'function') {
            await inlineLedgerRunQuery(`SAVEPOINT ${savePointId}`)
            await projection[event.type](
              store,
              event,
              await executeEncryption(event)
            )
            await inlineLedgerRunQuery(`RELEASE SAVEPOINT ${savePointId}`)
            lastSuccessEvent = event
          }
          appliedEventsCount++

          if (getVacantTimeInMillis() < 0) {
            nextCursor = eventstoreAdapter.getNextCursor(
              cursor,
              events.slice(0, appliedEventsCount)
            )
            localContinue = false
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
            `ROLLBACK TO SAVEPOINT ${savePointId};
             RELEASE SAVEPOINT ${savePointId}
          `
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
        `ROLLBACK TO SAVEPOINT ${rootSavePointId};
         RELEASE SAVEPOINT ${rootSavePointId}
      `
      )
    }

    if (lastError == null) {
      await inlineLedgerRunQuery(
        `UPDATE ${ledgerTableNameAsId} SET 
         ${
           lastSuccessEvent != null
             ? `\`SuccessEvent\` = ${escapeStr(
                 JSON.stringify(lastSuccessEvent)
               )},`
             : ''
         } 
         \`Cursor\` = ${escapeStr(JSON.stringify(nextCursor))}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)};

         COMMIT;
        `
      )
    } else {
      await inlineLedgerRunQuery(
        `UPDATE ${ledgerTableNameAsId}
         SET \`Errors\` = JSON_ARRAY_APPEND(COALESCE(\`Errors\`, JSON_ARRAY()), '$',
         CAST(${escapeStr(JSON.stringify(serializeError(lastError)))} AS JSON)),
         ${
           lastFailedEvent != null
             ? `\`FailedEvent\` = ${escapeStr(
                 JSON.stringify(lastFailedEvent)
               )},`
             : ''
         }
         ${
           lastSuccessEvent != null
             ? `\`SuccessEvent\` = ${escapeStr(
                 JSON.stringify(lastSuccessEvent)
               )},`
             : ''
         }
         \`Cursor\` = ${escapeStr(JSON.stringify(nextCursor))}
         WHERE \`EventSubscriber\` = ${escapeStr(readModelName)};

         COMMIT;
        `
      )
    }

    const isBuildSuccess = lastError == null && appliedEventsCount > 0
    cursor = nextCursor

    if (getVacantTimeInMillis() < 0) {
      localContinue = false
    }

    if (isBuildSuccess && localContinue) {
      rootSavePointId = generateGuid(xaKey, 'ROOT')

      await inlineLedgerRunQuery(
        `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
         START TRANSACTION;
        SAVEPOINT ${rootSavePointId};
        WITH \`CTE\` AS (
          SELECT \`XaKey\` FROM ${ledgerTableNameAsId}
            WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
            AND \`XaKey\` = ${escapeStr(xaKey)}
            AND \`IsPaused\` = FALSE
            AND \`Errors\` IS NULL
            FOR UPDATE NOWAIT
        )
          SELECT 1/Count(\`CTE\`.\`XaKey\`) AS \`NonZero\` FROM \`CTE\`;
        `,
        true
      )

      events = await eventsPromise
    } else {
      if (isBuildSuccess) {
        await next()
      }

      throw new PassthroughError()
    }
  }
}

const build = async (
  basePool,
  readModelName,
  store,
  projection,
  next,
  getVacantTimeInMillis,
  provideLedger,
  getEncryption
) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    tablePrefix,
    escapeId,
    escapeStr,
    generateGuid,
  } = basePool
  const pool = Object.create(basePool)

  try {
    const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
    const trxTableNameAsId = escapeId(`${tablePrefix}__TRX__`)

    const xaKey = generateGuid(`${Date.now()}${Math.random()}${process.pid}`)

    await inlineLedgerRunQuery(
      `START TRANSACTION;
      
      DELETE FROM ${trxTableNameAsId} WHERE \`Timestamp\` < 
      CAST(ROUND(UNIX_TIMESTAMP(SYSDATE(4)) * 1000) AS UNSIGNED INTEGER) - 86400000;

      SELECT * FROM ${ledgerTableNameAsId}
      WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
      AND \`IsPaused\` = FALSE
      AND \`Errors\` IS NULL
      FOR UPDATE NOWAIT;

      INSERT INTO ${trxTableNameAsId}(\`Timestamp\`, \`XaKey\`, \`XaValue\`) VALUES (
        CAST(ROUND(UNIX_TIMESTAMP(SYSDATE(4)) * 1000) AS UNSIGNED INTEGER), 
        ${escapeStr(xaKey)},
        CAST(CONNECTION_ID() AS CHAR)
      );

      UPDATE ${ledgerTableNameAsId}
      SET \`XaKey\` = ${escapeStr(xaKey)}
      WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
      AND \`IsPaused\` = FALSE
      AND \`Errors\` IS NULL;

      COMMIT;
      `
    )

    const rows = await inlineLedgerRunQuery(
      `SELECT * FROM ${ledgerTableNameAsId}
      WHERE \`EventSubscriber\` = ${escapeStr(readModelName)}
      AND \`XaKey\` = ${escapeStr(xaKey)}
      AND \`IsPaused\` = FALSE
      AND \`Errors\` IS NULL
      `
    )

    let readModelLedger = rows.length === 1 ? rows[0] : null
    if (readModelLedger == null || readModelLedger.Errors != null) {
      throw new PassthroughError()
    }

    const eventTypes =
      readModelLedger.EventTypes != null ? readModelLedger.EventTypes : null

    if (!Array.isArray(eventTypes) && eventTypes != null) {
      throw new TypeError('eventTypes')
    }

    const cursor =
      readModelLedger.Cursor != null ? readModelLedger.Cursor : null

    if (cursor != null && cursor.constructor !== String) {
      throw new TypeError('cursor')
    }

    await provideLedger(readModelLedger)

    Object.assign(pool, {
      getVacantTimeInMillis,
      getEncryption,
      ledgerTableNameAsId,
      trxTableNameAsId,
      xaKey,
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
      await inlineLedgerRunQuery(`ROLLBACK`)
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  }
}

export default build
