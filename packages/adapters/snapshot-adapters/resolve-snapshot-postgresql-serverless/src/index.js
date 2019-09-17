import RDSDataService from 'aws-sdk/clients/rdsdataservice'
const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const DEFAULT_BUCKET_SIZE = 100
const DEFAULT_TABLE_NAME = '__ResolveSnapshots__'
const LOAD_CHUNK_SIZE = 128000
const SAVE_CHUNK_SIZE = 32000

const coercer = ({
  intValue,
  stringValue,
  bigIntValue,
  longValue,
  booleanValue,
  ...rest
}) => {
  if (intValue != null) {
    return Number(intValue)
  } else if (bigIntValue != null) {
    return Number(bigIntValue)
  } else if (longValue != null) {
    return Number(longValue)
  } else if (stringValue != null) {
    return String(stringValue)
  } else if (booleanValue != null) {
    return Boolean(booleanValue)
  } else {
    throw new Error(`Unknown type ${JSON.stringify(rest)}`)
  }
}

const executeStatement = async (pool, sql, transactionId) => {
  const result = await pool.rdsDataService
    .executeStatement({
      ...(transactionId != null ? { transactionId } : {}),
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: true,
      sql
    })
    .promise()

  const { columnMetadata, records } = result

  if (!Array.isArray(records) || columnMetadata == null) {
    return null
  }

  const rows = []
  for (const record of records) {
    const row = {}
    for (let i = 0; i < columnMetadata.length; i++) {
      row[columnMetadata[i].name] = pool.coercer(record[i])
    }
    rows.push(row)
  }

  return rows
}

const beginTransaction = async pool => {
  const result = await pool.rdsDataService
    .beginTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      database: 'postgres'
    })
    .promise()

  const { transactionId } = result

  return transactionId
}

const commitTransaction = async (pool, transactionId) => {
  await pool.rdsDataService
    .commitTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId
    })
    .promise()
}

const rollbackTransaction = async (pool, transactionId) => {
  await pool.rdsDataService
    .rollbackTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId
    })
    .promise()
}

const init = async pool => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  if (pool.initPromise != null) {
    return pool.initPromise
  }

  pool.initPromise = (async () => {
    const {
      dbClusterOrInstanceArn,
      awsSecretStoreArn,
      databaseName,
      tableName,
      bucketSize,
      ...connectionOptions
    } = pool.config

    Object.assign(pool, {
      rdsDataService: new RDSDataService(connectionOptions),
      executeStatement: executeStatement.bind(null, pool),
      beginTransaction: beginTransaction.bind(null, pool),
      commitTransaction: commitTransaction.bind(null, pool),
      rollbackTransaction: rollbackTransaction.bind(null, pool),
      dbClusterOrInstanceArn,
      awsSecretStoreArn,
      bucketSize,
      databaseName,
      tableName,
      coercer,
      escapeId,
      escape
    })

    if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
      pool.bucketSize = DEFAULT_BUCKET_SIZE
    }

    if (pool.tableName == null || pool.tableName.constructor !== String) {
      pool.tableName = DEFAULT_TABLE_NAME
    }

    await pool.executeStatement(`CREATE TABLE IF NOT EXISTS ${pool.escapeId(
      pool.databaseName
    )}.${pool.escapeId(pool.tableName)} (
      ${pool.escapeId('SnapshotKey')} text NOT NULL,
      ${pool.escapeId('SnapshotContent')} text,
      PRIMARY KEY(${escapeId('SnapshotKey')})
    )`)

    pool.counters = new Map()
  })()

  return pool.initPromise
}

const loadSnapshot = async (pool, snapshotKey) => {
  await init(pool)

  let result = null

  for (let index = 0; ; index++) {
    const rows = await pool.executeStatement(
      `SELECT substring(${escapeId('SnapshotContent')} from ${index *
        LOAD_CHUNK_SIZE +
        1} for ${LOAD_CHUNK_SIZE})
      AS ${escapeId('SnapshotContentChunk')}
      FROM ${pool.escapeId(pool.databaseName)}.${escapeId(pool.tableName)}
      WHERE ${escapeId('SnapshotKey')} = ${escape(snapshotKey)} 
      LIMIT 1`
    )

    const content = rows.length > 0 ? rows[0].SnapshotContentChunk : null
    if (content == null) {
      break
    } else if (content != null && result == null) {
      result = ''
    }

    result += content

    if (content.length < LOAD_CHUNK_SIZE) {
      break
    }
  }

  return result
}

const saveSnapshot = async (pool, snapshotKey, snapshotValue) => {
  await init(pool)

  if (!pool.counters.has(snapshotKey)) {
    pool.counters.set(snapshotKey, 0)
  }

  if (pool.counters.get(snapshotKey) < pool.bucketSize) {
    pool.counters.set(snapshotKey, pool.counters.get(snapshotKey) + 1)
    return
  }
  pool.counters.set(snapshotKey, 0)

  const content = String(snapshotValue)
  const chunksCount = Math.ceil(content.length / SAVE_CHUNK_SIZE)

  if (chunksCount > 1) {
    let transactionId = null
    try {
      transactionId = await pool.beginTransaction()

      for (let index = 0; index < chunksCount; index++) {
        const chunk = content.substring(
          index * SAVE_CHUNK_SIZE,
          (index + 1) * SAVE_CHUNK_SIZE
        )

        if (index > 0) {
          await pool.executeStatement(
            `UPDATE ${pool.escapeId(pool.databaseName)}.${escapeId(
              pool.tableName
            )}
            SET ${escapeId('SnapshotContent')} = ${escapeId(
              'SnapshotContent'
            )} || ${escape(chunk)}
            WHERE ${escapeId('SnapshotKey')} = ${escape(snapshotKey)}`,
            transactionId
          )
        } else {
          await pool.executeStatement(
            `INSERT INTO ${pool.escapeId(pool.databaseName)}.${escapeId(
              pool.tableName
            )}(
              ${escapeId('SnapshotKey')}, 
              ${escapeId('SnapshotContent')}
            )
            VALUES(${escape(snapshotKey)}, ${escape(chunk)})
            ON CONFLICT (${escapeId('SnapshotKey')}) DO UPDATE
            SET ${escapeId('SnapshotContent')} = ${escape(chunk)}`,
            transactionId
          )
        }
      }

      await pool.commitTransaction(transactionId)
    } catch (error) {
      await pool.rollbackTransaction(transactionId)

      throw error
    }
  } else {
    await pool.executeStatement(
      `INSERT INTO ${pool.escapeId(pool.databaseName)}.${escapeId(
        pool.tableName
      )}(
        ${escapeId('SnapshotKey')}, 
        ${escapeId('SnapshotContent')}
      )
      VALUES(${escape(snapshotKey)}, ${escape(content)})
      ON CONFLICT (${escapeId('SnapshotKey')}) DO UPDATE
      SET ${escapeId('SnapshotContent')} = ${escape(content)}`
    )
  }
}

const dispose = async pool => {
  await init(pool)

  pool.disposed = true

  pool.counters.clear()
}

const drop = async (pool, snapshotKey) => {
  await init(pool)

  await pool.executeStatement(
    `DELETE FROM ${pool.escapeId(pool.databaseName)}.${escapeId(pool.tableName)}
    WHERE ${escapeId('SnapshotKey')}
    LIKE ${escape(`${snapshotKey}%`)}`
  )
}

const createAdapter = config => {
  const pool = { config }

  return Object.freeze({
    loadSnapshot: loadSnapshot.bind(null, pool),
    saveSnapshot: saveSnapshot.bind(null, pool),
    dispose: dispose.bind(null, pool),
    drop: drop.bind(null, pool)
  })
}

export default createAdapter
