const resubscribe = async (pool, readModelName, eventTypes, aggregateIds) => {
  const {
    PassthroughError,
    inlineLedgerRunQuery,
    inlineLedgerForceStop,
    dropReadModel,
    tablePrefix,
    escapeId,
    escape,
  } = pool

  const ledgerTableNameAsId = escapeId(`${tablePrefix}__LEDGER__`)
  const trxTableNameAsId = escapeId(`${tablePrefix}__TRX__`)

  try {
    await inlineLedgerRunQuery(`
      CREATE TABLE IF NOT EXISTS ${ledgerTableNameAsId}(
        \`EventSubscriber\` VARCHAR(190) NOT NULL,
        \`IsPaused\` TINYINT NOT NULL,
        \`EventTypes\` JSON NOT NULL,
        \`AggregateIds\` JSON NOT NULL,
        \`XaKey\` VARCHAR(190) NULL,
        \`Cursor\` JSON NULL,
        \`SuccessEvent\` JSON NULL,
        \`FailedEvent\` JSON NULL,
        \`Errors\` JSON NULL,
        \`Properties\` JSON NOT NULL,
        \`Schema\` JSON NULL,
        PRIMARY KEY(\`EventSubscriber\`)
      );
      
      CREATE TABLE IF NOT EXISTS ${trxTableNameAsId}(
        \`XaKey\` VARCHAR(190) NOT NULL,
        \`XaValue\` VARCHAR(190) NOT NULL,
        \`Timestamp\` BIGINT,
        PRIMARY KEY(\`XaKey\`)
      );
    `)
  } catch (e) {}

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)
      await inlineLedgerRunQuery(`
        START TRANSACTION;

        SELECT * FROM ${ledgerTableNameAsId}
        WHERE \`EventSubscriber\` = ${escape(readModelName)}
        FOR UPDATE NOWAIT;

        UPDATE ${ledgerTableNameAsId}
        SET \`Cursor\` = NULL,
        \`SuccessEvent\` = NULL,
        \`FailedEvent\` = NULL,
        \`Errors\` = NULL,
        \`IsPaused\` = TRUE
        WHERE \`EventSubscriber\` = ${escape(readModelName)};

        COMMIT;
      `)

      break
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  }

  await dropReadModel(pool, readModelName)

  while (true) {
    try {
      await inlineLedgerForceStop(pool, readModelName)

      await inlineLedgerRunQuery(`
        START TRANSACTION;

        SELECT * FROM ${ledgerTableNameAsId}
        WHERE \`EventSubscriber\` = ${escape(readModelName)}
        FOR UPDATE NOWAIT;

        INSERT INTO ${ledgerTableNameAsId}(
          \`EventSubscriber\`, \`EventTypes\`, \`AggregateIds\`, \`IsPaused\`, \`Properties\`
        ) VALUES (
           ${escape(readModelName)},
           ${
             eventTypes != null
               ? escape(JSON.stringify(eventTypes))
               : escape('null')
           },
           ${
             aggregateIds != null
               ? escape(JSON.stringify(aggregateIds))
               : escape('null')
           },
           COALESCE(NULLIF((SELECT Count(\`CTE\`.*) < 2 FROM \`CTE\`), TRUE), FALSE),
           CAST("{}" AS JSON)
        )
        ON DUPLICATE KEY UPDATE
        \`EventTypes\` = ${
          eventTypes != null
            ? escape(JSON.stringify(eventTypes))
            : escape('null')
        },
        \`AggregateIds\` = ${
          aggregateIds != null
            ? escape(JSON.stringify(aggregateIds))
            : escape('null')
        };

        COMMIT;
      `)
      break
    } catch (err) {
      if (!(err instanceof PassthroughError)) {
        throw err
      }
    }
  }
}

export default resubscribe
