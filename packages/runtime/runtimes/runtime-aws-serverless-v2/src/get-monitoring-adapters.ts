import type { Context } from './create-context'

export const getMonitoringAdapters = async (
  context: Context
): Promise<Context['assemblies']['monitoringAdapters']> => {
  if (context.assemblies.monitoringAdapters == null) {
    context.assemblies.monitoringAdapters = {}
  } else {
    return context.assemblies.monitoringAdapters
  }

  if (context.assemblies.monitoringAdapters.default == null) {
    const { default: createMonitoring } = await import(
      '@resolve-js/monitoring-aws-cloudwatch'
    )
    context.assemblies.monitoringAdapters.default = () =>
      createMonitoring({
        deploymentId: context.deploymentId,
        resolveVersion: context.resolveVersion,
      })
  }

  return context.assemblies.monitoringAdapters
}
