import getLog from 'resolve-debug-levels'

export default (scope: string) => getLog(`resolve:resolve-command:${scope}`)
