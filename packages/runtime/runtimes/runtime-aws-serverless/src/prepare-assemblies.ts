import createMonitoring from '@resolve-js/monitoring-aws-cloudwatch'
import { Assemblies, RuntimeAssemblies } from '@resolve-js/runtime-base'
import { getDeploymentId } from './utils'

export const prepareAssemblies = (
  assemblies: Assemblies,
  context: RuntimeAssemblies
): Assemblies => {
  if (assemblies.monitoringAdapters == null) {
    assemblies.monitoringAdapters = {}
  }

  if (assemblies.monitoringAdapters.default == null) {
    assemblies.monitoringAdapters.default = () =>
      createMonitoring({
        deploymentId: getDeploymentId(),
        resolveVersion: context.resolveVersion,
      })
  }
  return assemblies
}
