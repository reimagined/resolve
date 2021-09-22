import debugLevels from '@resolve-js/debug-levels'

export const getLog = (name: string) =>
  debugLevels(`resolve:monitoring-aws-cloudwatch:${name}`)
