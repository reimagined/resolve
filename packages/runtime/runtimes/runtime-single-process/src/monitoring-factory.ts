import { Monitoring, PerformanceTracer } from '@resolve-js/core'

export const monitoringFactory = (
  performance: PerformanceTracer
): Monitoring => ({
  error: () => void 0,
  duration: () => void 0,
  execution: () => void 0,
  group: function group() {
    return this
  },
  publish: () => Promise.resolve(),
  rate: () => void 0,
  time: () => void 0,
  timeEnd: () => void 0,
  performance,
})
