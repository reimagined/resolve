import logScope from '@resolve-js/debug-levels'

const getLog = (scope) => logScope(`resolve:scripts:${scope}`)

export default getLog
