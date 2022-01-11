import createLogger, { LeveledDebugger } from '@resolve-js/debug-levels'

const getLog = (scope: string): LeveledDebugger =>
  createLogger(`resolve:readmodel-postgresql:${scope}`)

export default getLog
