import getLog from '@resolve-js/debug-levels'

export default (scope: string) => getLog(`resolve:runtime-interop:${scope}`)
