import logScope from '@resolve-js/debug-levels'

const getLog = (scope) => logScope(`resolve:resolve-saga:${scope}`)

export default getLog
