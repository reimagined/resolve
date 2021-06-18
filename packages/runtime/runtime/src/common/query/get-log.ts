import logScope from '@resolve-js/debug-levels'

export const getLog = (scope: string) =>
  logScope(`resolve:resolve-query:${scope}`)
