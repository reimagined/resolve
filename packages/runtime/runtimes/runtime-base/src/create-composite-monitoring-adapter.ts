import type { MonitoringAdapter, Monitoring } from '@resolve-js/core'

const wrapVoidMethod = <
  K extends keyof Omit<Monitoring, 'group' | 'publish' | 'performance'>,
  P extends Parameters<Monitoring[K]>
>(
  methodName: K,
  adapterMap: Record<string, Monitoring>
): ((...args: P) => void) => {
  return (...args: Parameters<Monitoring[K]>) => {
    Object.keys(adapterMap).map((id) => {
      void (adapterMap[id][methodName] as any).apply(adapterMap[id], args)
    })
  }
}

const createCompositeAdapterImplementation = (
  adapterMap: Record<string, MonitoringAdapter>
): Monitoring => {
  return {
    group: (config: Record<string, string>) => {
      const nextAdapterMap = Object.keys(adapterMap).reduce(
        (acc, id) => ({
          ...acc,
          [id]: adapterMap[id].group(config),
        }),
        {} as Record<string, MonitoringAdapter>
      )

      return createCompositeAdapterImplementation(nextAdapterMap)
    },
    execution: wrapVoidMethod('execution', adapterMap),
    rate: wrapVoidMethod('rate', adapterMap),
    error: wrapVoidMethod('error', adapterMap),
    duration: wrapVoidMethod('duration', adapterMap),
    time: wrapVoidMethod('time', adapterMap),
    timeEnd: wrapVoidMethod('timeEnd', adapterMap),
    publish: async (...args) => {
      await Promise.all(
        Object.keys(adapterMap).map(async (id) =>
          adapterMap[id].publish(...args)
        )
      )
    },
    getMetrics: (id: string) => {
      const adapter = adapterMap[id]

      if (adapter == null) {
        throw new Error(`Monitoring adapter with '${id}' id not found`)
      }

      return adapter.getMetrics()
    },
    clearMetrics: (id: string) => {
      const adapter = adapterMap[id]

      if (adapter == null) {
        throw new Error(`Monitoring adapter with '${id}' id not found`)
      }

      return adapter.getMetrics()
    },
  }
}

export const createCompositeMonitoringAdapter = (
  adapterCreators: Record<string, () => MonitoringAdapter>
): Monitoring => {
  const ids = Object.keys(adapterCreators)
  const adapterMap = ids.reduce(
    (acc, id) => ({ ...acc, [id]: adapterCreators[id]() }),
    {} as Record<string, MonitoringAdapter>
  )

  return createCompositeAdapterImplementation(adapterMap)
}
