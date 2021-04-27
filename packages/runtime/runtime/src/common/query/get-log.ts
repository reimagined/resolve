import getLog from '@resolve-js/debug-levels'

export default (scope: string): any => getLog(`resolve:resolve-query:${scope}`)
