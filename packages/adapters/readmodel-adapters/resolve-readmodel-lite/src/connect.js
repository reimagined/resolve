import os from 'os'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`
const coerceEmptyString = obj =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj

const runQuery = async (pool, querySQL) => {
  const rows = Array.from(await pool.connection.all(querySQL))
  return rows
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
  let { tablePrefix, databaseFile, ...connectionOptions } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  if (databaseFile === ':memory:') {
    // eslint-disable-next-line no-console
    console.warn(
      `Internal mode "memory" can be used ONLY test purposes${os.EOL}Application WILL NOT work with "memory" mode`
    )

    if (pool.memoryConnection == null) {
      pool.memoryConnection = await imports.SQLite.open(':memory:')
    }
    pool.connection = pool.memoryConnection
  } else {
    pool.connection = await imports.SQLite.open(databaseFile)
  }

  Object.assign(pool, {
    runQuery: runQuery.bind(null, pool),
    connectionOptions,
    tablePrefix,
    databaseFile,
    makeNestedPath,
    escapeId,
    escape,
    ...imports
  })

  await pool.connection.exec(`PRAGMA busy_timeout=1000000`)
  await pool.connection.exec(`PRAGMA encoding=${escape('UTF-8')}`)
  await pool.connection.exec(`PRAGMA synchronous=EXTRA`)
  if (os.platform() !== 'win32') {
    await pool.connection.exec(`PRAGMA journal_mode=WAL`)
  }
}

export default connect
