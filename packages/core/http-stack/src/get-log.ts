import createLogger, { LeveledDebugger } from '@resolve-js/debug-levels'

const getLog = (scope: string): LeveledDebugger =>
  createLogger(`resolve:http-stack:${scope}`)

export default getLog
