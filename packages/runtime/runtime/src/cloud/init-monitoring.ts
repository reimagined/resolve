import createMonitoring from './monitoring'

import type { Resolve } from '../common/types'

const initMonitoring = (resolve: Resolve) => {
  resolve.monitoring = createMonitoring({
    deploymentId: process.env.RESOLVE_DEPLOYMENT_ID as string,
    resolveVersion: resolve.resolveVersion as string,
  })
}

export default initMonitoring
