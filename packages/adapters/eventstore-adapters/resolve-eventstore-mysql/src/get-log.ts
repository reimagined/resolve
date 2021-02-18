import getLog from 'resolve-debug-levels'

export default (scope: any) => getLog(`resolve:event-store-mysql:${scope}`)
