const host = require('my-local-ip')()

module.exports = function({ resolveConfig }) {
  const exports = []

  const origin =
    process.env.RESOLVE_ORIGIN || `http://${host}:${resolveConfig.port}`

  exports.push(`module.exports = "${origin}"`)

  return {
    code: exports.join('\r\n')
  }
}
