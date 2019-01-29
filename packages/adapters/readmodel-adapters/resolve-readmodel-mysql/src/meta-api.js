const lockConnectionExclusive = async (pool, readModelName) => {
  while (Promise.resolve(pool.lockPromise) === pool.lockPromise) {
    await pool.lockPromise
  }
  pool.affectedReadModel = readModelName
  pool.transactionHasUncommittedDDL = false

  pool.lockPromise = new Promise(resolve => {
    pool.unlockConnection = () => {
      pool.affectedReadModel = null
      pool.transactionHasUncommittedDDL = null
      pool.lockPromise = null
      resolve()
    }
  })
}

const dropReadModel = async (
  pool,
  readModelName,
  skipConnectionLocking = false
) => {
  const { queryDirect, metaName, tablePrefix, escapeId, escape } = pool
  pool.tableInfoCache.delete(readModelName)

  if (!skipConnectionLocking) {
    await lockConnectionExclusive(pool, readModelName)
  }

  try {
    await queryDirect(`
      LOCK TABLES ${escapeId(`${tablePrefix}${metaName}_Schema`)} WRITE,
      ${escapeId(`${tablePrefix}${metaName}_Locks`)} WRITE;
    `)

    const tableNames = (await queryDirect(
      `SELECT \`SecondKey\` AS \`TableName\`
      FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
      WHERE \`ReadModelName\`=${escape(readModelName)}
      AND \`FirstKey\`="TableDescriptor";`
    )).map(row => String(row.TableName))

    await queryDirect(
      `LOCK TABLES ${tableNames
        .concat(`${metaName}_Demand`, `${metaName}_Schema`, `${metaName}_Locks`)
        .map(tableName => `${escapeId(`${tablePrefix}${tableName}`)} WRITE`)
        .join(',')}; `
    )

    for (const tableName of tableNames) {
      await queryDirect(`DROP TABLE ${escapeId(`${tablePrefix}${tableName}`)};`)
    }

    await queryDirect(`
      DELETE FROM ${escapeId(`${tablePrefix}${metaName}_Demand`)}
      WHERE \`ReadModelName\`=${escape(readModelName)};

      DELETE FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
      WHERE \`ReadModelName\`=${escape(readModelName)};

      DELETE FROM ${escapeId(`${tablePrefix}${metaName}_Locks`)}
      WHERE \`ReadModelName\`=${escape(readModelName)};
    `)

    await queryDirect(`UNLOCK TABLES;`)
  } catch (error) {
    await queryDirect(`UNLOCK TABLES;`)
    throw error
  } finally {
    if (!skipConnectionLocking) {
      pool.unlockConnection()
    }
  }
}

const maybeDestroyTransactionLock = async (pool, readModelName) => {
  const connection = await pool.connectionPromise
  await connection.query(`
    SET @TransactionLockKey = NULL, @LockProcessId = NULL;

    SELECT @TransactionLockKey := \`LockKey\`
    FROM ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}
    WHERE \`ReadModelName\` = ${pool.escape(readModelName)};

    SELECT @LockProcessId := ID
    FROM information_schema.processlist
    WHERE ID = @TransactionLockKey;

    DELETE FROM ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}
    WHERE \`ReadModelName\` = ${pool.escape(readModelName)}
    AND \`LockKey\` = @TransactionLockKey
    AND \`HasUncommittedDDL\` = 0
    AND @LockProcessId IS NULL;
  `)

  const [results] = await connection.query(`
    UPDATE ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}
    SET \`LockKey\` = ${+pool.connectionId}
    WHERE \`ReadModelName\` = ${pool.escape(readModelName)}
    AND \`LockKey\` = @TransactionLockKey
    AND \`HasUncommittedDDL\` = 1
    AND @LockProcessId IS NULL;
  `)

  if (results.affectedRows > 1) {
    await dropReadModel(pool, readModelName, true)
  }
}

const beginTransactionImpl = async (pool, readModelName) => {
  try {
    await maybeDestroyTransactionLock(pool, readModelName)
  } catch (error) {
    return false
  }

  const connection = await pool.connectionPromise
  try {
    await connection.query(`
      INSERT INTO ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}(
        \`ReadModelName\`, \`LockKey\`, \`HasUncommittedDDL\`
      ) VALUES(
        ${pool.escape(readModelName)}, ${+pool.connectionId}, 0
      );

      START TRANSACTION;
    `)

    return true
  } catch (error) {
    await connection.query(`ROLLBACK;`)
    return false
  }
}

const beginTransaction = async (pool, readModelName, onlyLocal = false) => {
  await lockConnectionExclusive(pool, readModelName)
  if (onlyLocal) return null

  const result = await beginTransactionImpl(pool, readModelName)
  if (result === false) {
    pool.unlockConnection()
  }

  return result
}

const commitTransactionImpl = async (pool, readModelName) => {
  const connection = await pool.connectionPromise
  let commitError = null
  try {
    await connection.query('COMMIT;')
  } catch (error) {
    try {
      await connection.query(`ROLLBACK;`)
    } catch (err) {}

    commitError = error
  }

  await connection.query(`
    DELETE FROM ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}
    WHERE \`ReadModelName\`=${pool.escape(readModelName)}
    AND \`LockKey\`=${+pool.connectionId};
  `)

  if (commitError != null && pool.transactionHasUncommittedDDL) {
    await dropReadModel(pool, readModelName, true)
  }
}

const commitTransaction = async (pool, readModelName, onlyLocal = false) => {
  if (!onlyLocal) {
    await commitTransactionImpl(pool, readModelName)
  }

  pool.unlockConnection()
}

const rollbackTransactionImpl = async (pool, readModelName) => {
  const connection = await pool.connectionPromise
  let rollbackError = null
  try {
    await connection.query(`ROLLBACK;`)
  } catch (error) {
    rollbackError = error
  }

  await connection.query(`
    DELETE FROM ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}
    WHERE \`ReadModelName\`=${pool.escape(readModelName)}
    AND \`LockKey\`=${+pool.connectionId};
  `)

  if (rollbackError != null && pool.transactionHasUncommittedDDL) {
    await dropReadModel(pool, readModelName, true)
  }
}

const rollbackTransaction = async (pool, readModelName, onlyLocal = false) => {
  if (!onlyLocal) {
    await rollbackTransactionImpl(pool, readModelName)
  }

  pool.unlockConnection()
}

const queryDirect = async (pool, querySQL) => {
  const connection = await pool.connectionPromise
  const [rows] = await connection.query(querySQL)
  return rows
}

const queryTransactionalDML = async (pool, readModelName, querySQL) => {
  if (pool.affectedReadModel !== readModelName) {
    throw new Error(
      `Attempt to execute query on foreign read-model transaction:
      "${pool.affectedReadModel}"/"${readModelName}": ${querySQL}`
    )
  }

  return await pool.queryDirect(querySQL)
}

const queryTransactionalDDL = async (pool, readModelName, querySQL) => {
  if (pool.affectedReadModel !== readModelName) {
    throw new Error(
      `Attempt to execute query on foreign read-model transaction:
      "${pool.affectedReadModel}"/"${readModelName}": ${querySQL}`
    )
  }
  const connection = await pool.connectionPromise
  pool.transactionHasUncommittedDDL = true
  await connection.query(`
    COMMIT;

    UPDATE ${pool.escapeId(`${pool.tablePrefix}${pool.metaName}_Locks`)}
    SET \`HasUncommittedDDL\` = 1
    WHERE \`ReadModelName\` = ${pool.escape(readModelName)}
    AND \`LockKey\` = ${+pool.connectionId};
  `)

  await pool.queryDirect(querySQL)

  await connection.query(`START TRANSACTION;`)
}

const setupConnection = async pool => {
  pool.connectionPromise = pool.mysql.createConnection({
    ...pool.connectionOptions,
    multipleStatements: true
  })
  const connection = await pool.connectionPromise

  connection.onerror = async err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      pool.connectionId = null
      return await setupConnection(pool)
    }

    pool.lastMysqlError = err
    // eslint-disable-next-line no-console
    console.warn('SQL error: ', err)
  }

  await pool.queryDirect(
    `SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;`
  )

  pool.connectionId = (
    (await pool.queryDirect(`SELECT CONNECTION_ID() AS ConnectionId;`))[0] || {}
  ).ConnectionId
}

const connect = async ({ mysql, escapeId, escape }, pool, options) => {
  const {
    checkStoredTableSchema,
    tablePrefix,
    metaName,
    ...connectionOptions
  } = options

  Object.assign(pool, {
    queryTransactionalDML: queryTransactionalDML.bind(null, pool),
    queryTransactionalDDL: queryTransactionalDDL.bind(null, pool),
    queryDirect: queryDirect.bind(null, pool),
    tableInfoCache: new Map(),
    checkStoredTableSchema,
    connectionOptions,
    tablePrefix,
    metaName,
    escapeId,
    escape,
    mysql
  })

  await setupConnection(pool)
  await pool.queryDirect(`
    CREATE TABLE IF NOT EXISTS ${escapeId(`${tablePrefix}${metaName}_Schema`)} (
      \`ReadModelName\` VARCHAR(128) NOT NULL,
      \`FirstKey\` VARCHAR(128) NOT NULL,
      \`SecondKey\` VARCHAR(128) NOT NULL DEFAULT '',
      \`Value\` JSON NULL,
      PRIMARY KEY(\`ReadModelName\`, \`FirstKey\`, \`SecondKey\`)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS ${escapeId(`${tablePrefix}${metaName}_Locks`)} (
      \`ReadModelName\` VARCHAR(128) NOT NULL,
      \`LockKey\` BIGINT NOT NULL,
      \`HasUncommittedDDL\` BOOLEAN, 
      UNIQUE INDEX USING HASH(\`ReadModelName\`)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS ${escapeId(`${tablePrefix}${metaName}_Demand`)} (
      \`ReadModelName\` VARCHAR(128) NOT NULL,
      \`AccessTimestamp\` BIGINT NOT NULL,
      UNIQUE INDEX USING HASH(\`ReadModelName\`)
    ) ENGINE=InnoDB;
  `)
}

const reportDemandAccess = async (
  { metaName, tablePrefix, escapeId, escape, queryDirect },
  readModelName
) => {
  await queryDirect(`
    INSERT INTO ${escapeId(`${tablePrefix}${metaName}_Demand`)}(
      \`ReadModelName\`, \`AccessTimestamp\`
    ) VALUES(
      ${escape(readModelName)}, ${+Date.now()}
    ) ON DUPLICATE KEY UPDATE
    \`AccessTimestamp\` = ${+Date.now()}
  `)
}

const pollDemandAccess = async (
  { metaName, tablePrefix, escapeId, escape, queryDirect },
  readModelName
) => {
  const rows = await queryDirect(`
    SELECT \`AccessTimestamp\`
    FROM ${escapeId(`${tablePrefix}${metaName}_Demand`)}
    WHERE \`ReadModelName\` = ${escape(readModelName)};
  `)
  return rows.length > 0 ? rows[0].AccessTimestamp : 0
}

const getLastTimestamp = async (
  { metaName, tablePrefix, escapeId, escape, queryDirect },
  readModelName
) => {
  const rows = await queryDirect(
    `SELECT \`Value\` AS \`Timestamp\`
     FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
     WHERE \`ReadModelName\`=${escape(readModelName)}
     AND \`FirstKey\`="Timestamp"
     AND \`SecondKey\`="";
    `
  )
  return rows.length > 0 ? rows[0].Timestamp : null
}

const setLastTimestamp = async (
  { metaName, tablePrefix, escapeId, escape, queryTransactionalDML },
  readModelName,
  timestamp
) => {
  await queryTransactionalDML(
    readModelName,
    `INSERT INTO ${escapeId(`${tablePrefix}${metaName}_Schema`)}(
      \`ReadModelName\`, \`FirstKey\`, \`SecondKey\`, \`Value\`
    ) VALUES(
      ${escape(readModelName)}, "Timestamp", "", CAST(${+timestamp} AS JSON)
    ) ON DUPLICATE KEY UPDATE
    \`Value\` = CAST(${+timestamp} AS JSON);`
  )
}

const getTableInfo = async (
  {
    queryDirect,
    metaName,
    tablePrefix,
    escapeId,
    escape,
    tableInfoCache,
    checkStoredTableSchema
  },
  readModelName,
  tableName
) => {
  if (!tableInfoCache.has(readModelName)) {
    tableInfoCache.set(readModelName, new Map())
  }
  const currentCache = tableInfoCache.get(readModelName)
  if (currentCache.has(tableName)) {
    return currentCache.get(tableName)
  }

  const rows = await queryDirect(
    `SELECT \`Value\` AS \`TableDescription\`
    FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
    WHERE \`ReadModelName\`=${escape(readModelName)}
    AND \`FirstKey\`="TableDescriptor"
    AND \`SecondKey\`=${escape(tableName)};`
  )

  const tableDescription = rows.length > 0 ? rows[0].TableDescription : null
  if (tableDescription == null) {
    return null
  }

  if (!checkStoredTableSchema(tableName, tableDescription)) {
    throw new Error(
      `Can't restore "${tableName}" meta information due invalid schema: ${JSON.stringify(
        tableDescription
      )}`
    )
  }

  currentCache.set(tableName, tableDescription)

  return tableDescription
}

const tableExists = async (pool, readModelName, tableName) => {
  return !!(await getTableInfo(pool, readModelName, tableName))
}

const describeTable = async (
  { queryDirect, metaName, tablePrefix, escapeId, escape },
  readModelName,
  tableName,
  metaSchema
) => {
  await queryDirect(
    `INSERT INTO ${escapeId(`${tablePrefix}${metaName}_Schema`)}(
      \`ReadModelName\`, \`FirstKey\`, \`SecondKey\`, \`Value\`
    ) VALUES(
      ${escape(readModelName)}, "TableDescriptor", ${escape(tableName)},
      CAST(${escape(JSON.stringify(metaSchema))} AS JSON)
    );`
  )
}

const checkAndAcquireSequence = async (
  { queryTransactionalDML, metaName, tablePrefix, escapeId, escape },
  readModelName,
  aggregateId,
  aggregateVersion,
  maybeUnordered
) => {
  const rows = await queryTransactionalDML(
    readModelName,
    `SELECT \`Value\` AS \`AggregateVersion\`
    FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
    WHERE \`ReadModelName\`=${escape(readModelName)}
    AND \`FirstKey\`="AggregatesVersionsMap"
    AND \`SecondKey\`=${escape(aggregateId)};`
  )

  const storedVersion = rows.length > 0 ? +rows[0].AggregateVersion : null

  if (storedVersion != null && aggregateVersion <= storedVersion) {
    return 'RETRANSMITTED_EVENT'
  }

  if (
    maybeUnordered &&
    !(
      storedVersion + 1 === aggregateVersion ||
      (storedVersion == null && aggregateVersion === 1)
    )
  ) {
    return 'REORDERED_EVENT'
  }

  await queryTransactionalDML(
    readModelName,
    `INSERT INTO ${escapeId(`${tablePrefix}${metaName}_Schema`)}(
      \`ReadModelName\`, \`FirstKey\`, \`SecondKey\`, \`Value\`
    ) VALUES(
      ${escape(readModelName)}, "AggregatesVersionsMap",
      ${escape(aggregateId)},
      CAST(${+aggregateVersion} AS JSON)
    ) ON DUPLICATE KEY UPDATE
    \`Value\` = CAST(${+aggregateVersion} AS JSON);`
  )

  return null
}

const checkEventProcessed = async (
  { queryTransactionalDML, metaName, tablePrefix, escapeId, escape },
  readModelName,
  aggregateId,
  aggregateVersion
) => {
  const rows = await queryTransactionalDML(
    readModelName,
    `SELECT \`Value\` AS \`AggregateVersion\`
    FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
    WHERE \`ReadModelName\`=${escape(readModelName)}
    AND \`FirstKey\`="AggregatesVersionsMap"
    AND \`SecondKey\`=${escape(aggregateId)};`
  )

  const storedVersion = rows.length > 0 ? +rows[0].AggregateVersion : null

  return storedVersion >= aggregateVersion
}

const disconnect = async pool => {
  const connection = await pool.connectionPromise
  await connection.end()
}

const drop = async (pool, { dropDataTables, dropMetaTable }) => {
  try {
    const { queryDirect, metaName, tablePrefix, escapeId } = pool
    pool.tableInfoCache.clear()

    await lockConnectionExclusive(pool, Symbol.for('DROP_SCOPE'))
    await queryDirect(`
      LOCK TABLES ${escapeId(`${tablePrefix}${metaName}_Schema`)} WRITE,
      ${escapeId(`${tablePrefix}${metaName}_Locks`)} WRITE;
    `)

    if (dropDataTables === true) {
      const tableNames = (await queryDirect(
        `SELECT \`SecondKey\` AS \`TableName\`
        FROM ${escapeId(`${tablePrefix}${metaName}_Schema`)}
        WHERE \`FirstKey\`="TableDescriptor"`
      )).map(row => String(row.TableName))

      await queryDirect(
        `LOCK TABLES ${tableNames
          .concat(
            `${metaName}_Demand`,
            `${metaName}_Schema`,
            `${metaName}_Locks`
          )
          .map(tableName => `${escapeId(`${tablePrefix}${tableName}`)} WRITE`)
          .join(',')}; `
      )

      for (const tableName of tableNames) {
        await queryDirect(
          `DROP TABLE ${escapeId(`${tablePrefix}${tableName}`)};`
        )
      }
    }

    if (dropMetaTable === true) {
      await queryDirect(`
        DROP TABLE ${escapeId(`${tablePrefix}${metaName}_Demand`)};
        DROP TABLE ${escapeId(`${tablePrefix}${metaName}_Schema`)};
        DROP TABLE ${escapeId(`${tablePrefix}${metaName}_Locks`)};
      `)
    }

    await queryDirect(`UNLOCK TABLES;`)
    pool.unlockConnection()
  } catch (error) {
    await queryDirect(`UNLOCK TABLES;`)
    pool.unlockConnection()
    throw error
  }
}

export default {
  connect,
  reportDemandAccess,
  pollDemandAccess,
  checkAndAcquireSequence,
  checkEventProcessed,
  getLastTimestamp,
  setLastTimestamp,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  tableExists,
  getTableInfo,
  describeTable,
  dropReadModel,
  disconnect,
  drop
}
