import debug, { Debug, Debugger } from 'debug'

const logLevels = ['error', 'warn', 'log', 'debug', 'info', 'verbose']
const defaultLogLevel = logLevels[3]

type Logger = (...args: any[]) => void

interface LeveledDebugger {
  log: Logger
  error: Logger
  warn: Logger
  debug: Logger
  info: Logger
  verbose: Logger
}

const emptyFunction: Logger = (): void => {
  /* no-op */
}

const debugLevels = (
  debugProvider: Debug,
  envProvider: { [key: string]: string | undefined },
  namespace: string
): LeveledDebugger & Debugger => {
  let logLevel = defaultLogLevel
  const debugLevelEnv = envProvider.DEBUG_LEVEL

  if (debugLevelEnv != null) {
    logLevel = debugLevelEnv
  }
  if (logLevels.indexOf(logLevel) < 0) {
    debugProvider(namespace)(
      `Attempted to set unsupported DEBUG_LEVEL="${logLevel}", falling back to the default level "${defaultLogLevel}"`
    )
    logLevel = defaultLogLevel
  }

  if (!envProvider.hasOwnProperty('DEBUG')) {
    debugProvider.enable('resolve:*')
    envProvider['DEFAULT_DEBUG'] = 'true'
  }

  if (envProvider['DEFAULT_DEBUG'] === 'true') {
    logLevel = logLevels[2]
  }

  const allowedLevels = logLevels.slice(0, logLevels.indexOf(logLevel) + 1)

  const originalLogger = debugProvider(namespace)

  return Object.assign(originalLogger.bind(null), {
    log: allowedLevels.indexOf('log') > -1 ? originalLogger : emptyFunction,
    error: allowedLevels.indexOf('error') > -1 ? originalLogger : emptyFunction,
    warn: allowedLevels.indexOf('warn') > -1 ? originalLogger : emptyFunction,
    debug: allowedLevels.indexOf('debug') > -1 ? originalLogger : emptyFunction,
    info: allowedLevels.indexOf('info') > -1 ? originalLogger : emptyFunction,
    verbose:
      allowedLevels.indexOf('verbose') > -1 ? originalLogger : emptyFunction,
  })
}

export { debugLevels, Debug, LeveledDebugger }

let envProvider = {}
try {
  envProvider = process.env
} catch (error) {}

export default debugLevels.bind(null, debug, envProvider)
