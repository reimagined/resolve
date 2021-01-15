import getLog, { LeveledDebugger } from 'resolve-debug-levels'

export default (scope: string): LeveledDebugger & debug.Debugger =>
  getLog(`resolve:event-store-base:${scope}`)
