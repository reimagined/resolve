import logScope from '@resolve-js/debug-levels'

export const getLog = (scope) => logScope(`resolve:scripts:${scope}`)
