import debugLevels from 'resolve-debug-levels'

const getLog = name => debugLevels(`resolve:cloud:scheduler:${name}`)

export default getLog
