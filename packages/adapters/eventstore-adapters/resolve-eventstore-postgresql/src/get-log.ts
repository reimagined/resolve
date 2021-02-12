import getLog, { LeveledDebugger } from '@reimagined/debug-levels'

export default (scope: any): LeveledDebugger & debug.Debugger =>
  getLog(`resolve:event-store-postgres:${scope}`)
