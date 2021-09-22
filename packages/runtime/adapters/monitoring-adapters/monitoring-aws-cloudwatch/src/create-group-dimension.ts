import { MonitoringDimensions } from './types'

export const createGroupDimensions = (config: Record<string, string>) =>
  Object.keys(config).reduce(
    (acc, key) =>
      config[key] != null
        ? acc.concat({
            Name: key,
            Value: config[key],
          })
        : acc,
    [] as MonitoringDimensions
  )
