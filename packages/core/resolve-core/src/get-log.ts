import getLog from '@reimagined/debug-levels'

export default (scope: string) =>
  getLog(`resolve:resolve-runtime-interop:${scope}`)
