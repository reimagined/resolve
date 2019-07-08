const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`
const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj

const runQuery = async (pool, querySQL) => {
  const rows = Array.from(await pool.connection.all(querySQL))
  return rows
}

const runRawQuery = async (pool, querySQL) => {
  const result = await pool.connection.exec(querySQL)
  return result
}

const makeNestedPath = nestedPath => {
  let result = '$'
  for (const part of nestedPath) {
    if (part == null || part.constructor !== String) {
      throw new Error('Invalid JSON path')
    }
    const invariant = Number(part)
    if (!isNaN(invariant)) {
      result += `[${invariant}]`
    } else {
      result += `.${part
        .replace(/\u001a/g, '\u001a0')
        .replace(/"/g, '\u001a1')
        .replace(/\./g, '\u001a2')}`
    }
  }

  return result
}

const connect = async (imports, pool, options) => {
  let {
    tablePrefix,
    databaseFile,
    performanceTracer,
    ...connectionOptions
  } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  Object.assign(pool, {
    runRawQuery: runRawQuery.bind(null, pool),
    runQuery: runQuery.bind(null, pool),
    connectionOptions,
    performanceTracer,
    tablePrefix,
    databaseFile,
    makeNestedPath,
    escapeId,
    escape,
    ...imports
  })

  if (databaseFile === ':memory:') {
    if (Object.keys(pool.memoryStore).length === 0) {
      const temporaryFile = imports.tmp.fileSync()
      Object.assign(pool.memoryStore, {
        ...temporaryFile,
        drop: temporaryFile.removeCallback.bind(temporaryFile)
      })
    }
    pool.connection = await imports.SQLite.open(pool.memoryStore.name)
  } else {
    pool.connection = await imports.SQLite.open(databaseFile)
  }

  await pool.connection.exec(`PRAGMA busy_timeout=1000000`)
  await pool.connection.exec(`PRAGMA encoding=${escape('UTF-8')}`)
  await pool.connection.exec(`PRAGMA synchronous=EXTRA`)
  if (imports.os.platform() !== 'win32') {
    await pool.connection.exec(`PRAGMA journal_mode=WAL`)
  }
}

export default connect
