import getLog, { LeveledDebugger } from '@reimagined/debug-levels'

export default (scope: string): LeveledDebugger & debug.Debugger =>
  getLog(`resolve:event-store-sqlite:${scope}`)
