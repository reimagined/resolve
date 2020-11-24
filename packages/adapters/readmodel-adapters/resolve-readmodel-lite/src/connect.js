const escapeId = (str) => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = (str) => `'${String(str).replace(/(['])/gi, '$1$1')}'`
const coerceEmptyString = (obj) =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj
const emptyTransformer = Function('') // eslint-disable-line no-new-func
const SQLITE_BUSY = 'SQLITE_BUSY'

const randRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = (retries) =>
  new Promise((resolve) =>
    setTimeout(resolve, randRange(0, Math.min(500, 2 * 2 ** retries)))
  )

const commonRunQuery = async (
  pool,
  isInlineLedger,
  sqlQuery,
  multiLine = false,
  passthroughRuntimeErrors = false
) => {
  const PassthroughError = pool.PassthroughError
  const executor = !multiLine
    ? pool.connection.all.bind(pool.connection)
    : pool.connection.exec.bind(pool.connection)
  const transformer = !multiLine ? Array.from.bind(Array) : emptyTransformer
  let result = null

  for (let retry = 0; ; retry++) {
    try {
      result = await executor(sqlQuery)
      break
    } catch (error) {
      const isPassthroughError = PassthroughError.isPassthroughError(
        error,
        !!passthroughRuntimeErrors
      )
      const isSqliteBusy = error != null && error.code === SQLITE_BUSY
      if (!isInlineLedger && isSqliteBusy) {
        await fullJitter(retry)
      } else if (isInlineLedger && isPassthroughError) {
        const isRuntime = !PassthroughError.isPassthroughError(error, false)
        throw new PassthroughError(isRuntime)
      } else {
        throw error
      }
    }
  }

  return transformer(result)
}

const makeNestedPath = (nestedPath) => {
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
    preferEventBusLedger,
    performanceTracer,
    ...connectionOptions
  } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  Object.assign(pool, {
    inlineLedgerRunQuery: commonRunQuery.bind(null, pool, true),
    runQuery: commonRunQuery.bind(null, pool, false),
    fullJitter,
    connectionOptions,
    performanceTracer,
    tablePrefix,
    databaseFile,
    makeNestedPath,
    escapeId,
    escape,
    ...imports,
  })

  const { SQLite, fs, os, tmp } = imports

  if (databaseFile === ':memory:') {
    if (process.env.RESOLVE_LAUNCH_ID != null) {
      const tmpName = `${os.tmpdir()}/read-model-${+process.env
        .RESOLVE_LAUNCH_ID}.db`
      const removeCallback = () => {
        if (fs.existsSync(tmpName)) {
          fs.unlinkSync(tmpName)
        }
      }

      if (!fs.existsSync(tmpName)) {
        fs.writeFileSync(tmpName, '')
        process.on('SIGINT', removeCallback)
        process.on('SIGTERM', removeCallback)
        process.on('beforeExit', removeCallback)
        process.on('exit', removeCallback)
      }

      Object.assign(pool.memoryStore, {
        name: tmpName,
        drop: removeCallback,
      })
    } else if (Object.keys(pool.memoryStore).length === 0) {
      const temporaryFile = tmp.fileSync()
      Object.assign(pool.memoryStore, {
        name: temporaryFile.name,
        drop: temporaryFile.removeCallback.bind(temporaryFile),
      })
    }

    pool.connectionUri = pool.memoryStore.name
  } else {
    pool.connectionUri = databaseFile
  }

  for (let retry = 0; ; retry++) {
    try {
      pool.connection = await SQLite.open(pool.connectionUri)
      break
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        await fullJitter(retry)
      } else {
        throw error
      }
    }
  }

  await pool.connection.configure('busyTimeout', 0)

  const configureSql = `
    PRAGMA busy_timeout=0;
    PRAGMA encoding=${escape('UTF-8')};
    PRAGMA synchronous=EXTRA;
    ${
      databaseFile === ':memory:'
        ? `PRAGMA journal_mode=MEMORY`
        : `PRAGMA journal_mode=DELETE`
    };
  `

  if (!preferEventBusLedger) {
    for (let retry = 0; ; retry++) {
      try {
        await pool.inlineLedgerRunQuery(`
          BEGIN EXCLUSIVE;
          ${configureSql}
          COMMIT;
        `, true)
        break
      } catch (error) {
        if (!(error instanceof pool.PassthroughError)) {
          throw error
        }

        try {
          await pool.inlineLedgerRunQuery(`ROLLBACK`, true)
        } catch (err) {
          if (!(err instanceof pool.PassthroughError)) {
            throw err
          }
        }

        await fullJitter(retry)
      }
    }
  } else {
    await pool.runQuery(configureSql, true)
  }
}

export default connect
