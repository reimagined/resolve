import type {
  CommonRunQueryMethodUnpromiseResult,
  InlineLedgerRunQueryMethod,
  MakeNestedPathMethod,
  EscapeableMethod,
  CurrentConnectMethod,
  AdapterPool,
} from './types'

export const escapeId: EscapeableMethod = (str) =>
  `"${String(str).replace(/(["])/gi, '$1$1')}"`
export const escapeStr: EscapeableMethod = (str) =>
  `'${String(str).replace(/(['])/gi, '$1$1')}'`

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

const inlineLedgerRunQuery = async <
  T extends Parameters<InlineLedgerRunQueryMethod>[1]
>(
  pool: AdapterPool,
  sqlQuery: Parameters<InlineLedgerRunQueryMethod>[0],
  multiLine: T = false as T,
  passthroughRuntimeErrors: Parameters<InlineLedgerRunQueryMethod>[2] = false
): Promise<CommonRunQueryMethodUnpromiseResult<T>> => {
  const PassthroughError = pool.PassthroughError
  const executor = async (sql: string) => {
    return !multiLine
      ? pool.connection.prepare(sql).all()
      : pool.connection.exec(sql)
  }
  const transformer = !multiLine ? Array.from.bind(Array) : emptyTransformer
  let result = null

  for (let retry = 0; ; retry++) {
    try {
      result = await executor(sqlQuery)
      break
    } catch (error) {
      if (pool.activePassthrough) {
        const isPassthroughError = PassthroughError.isPassthroughError(
          error,
          !!passthroughRuntimeErrors
        )
        if (isPassthroughError) {
          const isRuntime = !PassthroughError.isPassthroughError(error, false)
          throw new PassthroughError(isRuntime)
        } else {
          throw error
        }
      } else {
        if (PassthroughError.isPassthroughError(error, false)) {
          await fullJitter(retry)
        } else {
          throw error
        }
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

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let { tablePrefix, databaseFile } = options
  tablePrefix = coerceEmptyString(tablePrefix)
  databaseFile = coerceEmptyString(databaseFile)

  Object.assign(pool, {
    inlineLedgerRunQuery: inlineLedgerRunQuery.bind<
      null,
      AdapterPool,
      Parameters<InlineLedgerRunQueryMethod>,
      ReturnType<typeof inlineLedgerRunQuery>
    >(null, pool) as InlineLedgerRunQueryMethod,
    fullJitter,
    tablePrefix,
    databaseFile,
    makeNestedPath,
    escapeId,
    escapeStr,
    activePassthrough: false,
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
      pool.connection = await new SQLite(pool.connectionUri)
      break
    } catch (error) {
      if (
        error != null &&
        typeof error.code === 'string' &&
        error.code.startWith(SQLITE_BUSY)
      ) {
        await fullJitter(retry)
      } else {
        throw error
      }
    }
  }

  //await (pool.connection as any)?.driver?.serialize?.()

  //await pool.connection.configure('busyTimeout', 0)

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
