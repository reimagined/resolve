import createMonitoring from '@resolve-js/monitoring-aws-cloudwatch'
import { Assemblies, RuntimeEntryContext } from '@resolve-js/runtime-base'
import { getDeploymentId } from './utils'

export const prepareAssemblies = (
  assemblies: Assemblies,
  context: RuntimeEntryContext
): Assemblies => {
  assemblies.monitoringAdapters['aws-cloudwatch'] = () =>
    createMonitoring({
      deploymentId: getDeploymentId(),
      resolveVersion: context.resolveVersion,
    })
  return assemblies
}
