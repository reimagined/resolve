const debug = require('debug-levels')

const createLogger = scope => debug(`resolve:cloud:${scope}`)

module.exports = createLogger
