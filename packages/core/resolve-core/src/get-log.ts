import getLog from '@reimagined/debug-levels'

export default (scope: string) =>
  getLog(`resolve:runtime-interop:${scope}`)
