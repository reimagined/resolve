import debug, { Debug, Debugger } from 'debug'

const logLevels = ['log', 'error', 'warn', 'debug', 'info', 'verbose']
const defaultLogLevel = logLevels[2]

type Logger = (...args: any[]) => void

type ProcessEnv = typeof process.env

interface LeveledDebugger {
  log: Logger
  error: Logger
  warn: Logger
  debug: Logger
  info: Logger
  verbose: Logger
}

type LoggerPool = {
  envProvider: ProcessEnv
  logLevels: Array<string>
  debugProvider: Debug
  namespace: string
  originalLogger: Debugger
}

let defaultEnvProvider: ProcessEnv = {}
try {
  defaultEnvProvider = process.env
} catch (error) {}

const cacheLogLevel: { key: string | symbol | undefined; value: string } = {
  key: Symbol(),
  value: defaultLogLevel,
}
const getLogLevel = ({ envProvider, debugProvider, namespace }: LoggerPool) => {
  const debugLevelEnv = envProvider.DEBUG_LEVEL

  if (cacheLogLevel.key === debugLevelEnv) {
    return cacheLogLevel.value
  }

  let logLevel = defaultLogLevel

  if (debugLevelEnv != null) {
    logLevel = debugLevelEnv
  }
  if (logLevels.indexOf(logLevel) < 0) {
    debugProvider(namespace)(
      `Attempted to set unsupported DEBUG_LEVEL="${logLevel}", falling back to the default level "${defaultLogLevel}"`
    )
    logLevel = defaultLogLevel
  }

  // Update cache
  cacheLogLevel.key = debugLevelEnv
  cacheLogLevel.value = logLevel

  return logLevel
}

const createLogger = (pool: LoggerPool, method: string) => {
  const { logLevels, originalLogger } = pool

  const methodIndex = logLevels.indexOf(method)

  if (methodIndex === -1) {
    throw new Error(`Incorrect method "${method}"`)
  }

  return (formatter: any, ...args: Array<any>) => {
    const logLevel = getLogLevel(pool)

    if (methodIndex <= logLevels.indexOf(logLevel)) {
      originalLogger(formatter, ...args)
    }
  }
}

const debugLevels = (
  debugProvider: Debug,
  envProvider: { [key: string]: string | undefined },
  namespace: string
): LeveledDebugger & Debugger => {
  const originalLogger = debugProvider(namespace)

  if (!envProvider.hasOwnProperty('DEBUG')) {
    debugProvider.enable('resolve:*')
  }

  const pool: LoggerPool = {
    envProvider,
    logLevels,
    debugProvider,
    namespace,
    originalLogger,
  }

  return Object.assign(originalLogger.bind(null), {
    log: createLogger(pool, 'log'),
    error: createLogger(pool, 'error'),
    warn: createLogger(pool, 'warn'),
    debug: createLogger(pool, 'debug'),
    info: createLogger(pool, 'info'),
    verbose: createLogger(pool, 'verbose'),
  })
}

export { debugLevels, Debug, LeveledDebugger }

export default debugLevels.bind(null, debug, defaultEnvProvider)
