import getLog from 'resolve-debug-levels'

export default (scope: string): any => getLog(`resolve:resolve-query:${scope}`)
