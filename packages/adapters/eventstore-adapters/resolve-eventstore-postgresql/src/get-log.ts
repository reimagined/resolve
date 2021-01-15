import getLog, { LeveledDebugger } from 'resolve-debug-levels'

export default (scope: any): LeveledDebugger & debug.Debugger =>
  getLog(`resolve:event-store-postgres:${scope}`)
