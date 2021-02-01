import type {
  CommonRunQueryMethodUnpromiseResult,
  CommonRunQueryMethod,
  InlineLedgerRunQueryMethod,
  RunQueryMethod,
  MakeNestedPathMethod,
  EscapeableMethod,
  CurrentConnectMethod
} from './types'

export const escapeId: EscapeableMethod = (str) => `"${String(str).replace(/(["])/gi, '$1$1')}"`
export const escapeStr: EscapeableMethod = (str) => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const coerceEmptyString = (obj: any) =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj
const emptyTransformer = Function('') // eslint-disable-line no-new-func
const SQLITE_BUSY = 'SQLITE_BUSY'

const randRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const fullJitter = (retries: number): Promise<void> =>
  new Promise((resolve) =>
    setTimeout(resolve, randRange(0, Math.min(500, 2 * 2 ** retries)))
  )

const commonRunQuery: CommonRunQueryMethod = async <T extends Parameters<CommonRunQueryMethod>[3]> (
  pool: Parameters<CommonRunQueryMethod>[0],
  isInlineLedger: Parameters<CommonRunQueryMethod>[1],
  sqlQuery: Parameters<CommonRunQueryMethod>[2],
  multiLine: T = false as T,
  passthroughRuntimeErrors: Parameters<CommonRunQueryMethod>[4] = false
): Promise<CommonRunQueryMethodUnpromiseResult<T>> => {
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

  return transformer(result) as CommonRunQueryMethodUnpromiseResult<T>
}

const makeNestedPath: MakeNestedPathMethod = (nestedPath) => {
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

const connect: CurrentConnectMethod = async (
  imports,
  pool,
  options
) => {
  let {
    tablePrefix,
    databaseFile,
    performanceTracer,
    ...connectionOptions
  } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  Object.assign(pool, {
    inlineLedgerRunQuery: commonRunQuery.bind(null, pool, true) as InlineLedgerRunQueryMethod,
    runQuery: commonRunQuery.bind(null, pool, false) as RunQueryMethod,
    fullJitter,
    connectionOptions,
    performanceTracer,
    tablePrefix,
    databaseFile,
    makeNestedPath,
    escapeId,
    escapeStr,
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
    PRAGMA encoding=${escapeStr('UTF-8')};
    PRAGMA synchronous=EXTRA;
    ${
      databaseFile === ':memory:'
        ? `PRAGMA journal_mode=MEMORY`
        : `PRAGMA journal_mode=DELETE`
    };
  `

  while (true) {
    try {
      await pool.inlineLedgerRunQuery(configureSql, true)
      break
    } catch (error) {
      if (!(error instanceof pool.PassthroughError)) {
        throw error
      }

      await fullJitter(0)
    }
  }
}

export default connect
