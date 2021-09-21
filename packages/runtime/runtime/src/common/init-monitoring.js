const initMonitoring = (resolve) => {
  const { monitoringAdapters: monitoringAdapterCreators } = resolve.assemblies

  // TODO: use array, move into common, use options to pass it into adapter
  resolve.monitoring = monitoringAdapterCreators[0]({
    deploymentId: process.env.RESOLVE_DEPLOYMENT_ID,
    resolveVersion: resolve.resolveVersion,
  })
}

export default initMonitoring
