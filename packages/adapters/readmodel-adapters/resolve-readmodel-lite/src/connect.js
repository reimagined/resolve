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

  Object.assign(pool, {
    connection: await imports.SQLite.open(databaseFile),
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
}

export default connect
