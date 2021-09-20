import debugLevels from '@resolve-js/debug-levels'
export const getLog = (scope: string) => debugLevels(`resolve:runtime:${scope}`)
