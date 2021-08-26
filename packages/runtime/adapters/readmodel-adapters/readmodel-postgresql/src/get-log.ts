import createLogger, { LeveledDebugger } from '@resolve-js/debug-levels'

const getLog = (scope: string): LeveledDebugger =>
  createLogger(`resolve:read-model-postgresql:${scope}`)

export default getLog
