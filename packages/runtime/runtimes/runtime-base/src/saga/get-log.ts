import logScope from '@resolve-js/debug-levels'

const getLog = (scope: string) => logScope(`resolve:resolve-saga:${scope}`)

export default getLog
