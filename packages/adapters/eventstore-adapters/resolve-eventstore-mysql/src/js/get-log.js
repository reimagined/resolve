import getLog from 'resolve-debug-levels'

export default scope => getLog(`resolve:event-store-mysql:${scope}`)
