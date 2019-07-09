import debugLevels from 'debug-levels'

const getLog = name => debugLevels(`resolve:cloud:scheduler:${name}`)

export default getLog
