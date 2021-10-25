import createMonitoring from '@resolve-js/monitoring-console'
import { Assemblies } from '@resolve-js/runtime-base'

export const prepareAssemblies = (assemblies: Assemblies): Assemblies => {
  if (assemblies.monitoringAdapters.default == null) {
    assemblies.monitoringAdapters.default = () =>
      createMonitoring({
        publishMode: 'processExit',
      })
  }
  return assemblies
}
