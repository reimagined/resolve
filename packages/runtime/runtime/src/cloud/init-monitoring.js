import createMonitoring from './monitoring'

const initMonitoring = (resolve) => {
  resolve.monitoring = createMonitoring({
    deploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    resolveVersion: resolve.resolveVersion,
  })
}

export default initMonitoring
