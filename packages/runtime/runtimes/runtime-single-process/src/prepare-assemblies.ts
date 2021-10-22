import createMonitoring from '@resolve-js/monitoring-console'
import { Assemblies } from '@resolve-js/runtime-base'

export const prepareAssemblies = (assemblies: Assemblies): Assemblies => {
  assemblies.monitoringAdapters.console = () =>
    createMonitoring({
      publishMode: 'processExit',
    })
  return assemblies
}
