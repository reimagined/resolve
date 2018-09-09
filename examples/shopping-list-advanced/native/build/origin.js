const getLocalHost = require('my-local-ip')

module.exports = ({ resolveConfig }) => {
  const exports = []

  const origin =
    process.env.RESOLVE_ORIGIN ||
    `http://${getLocalHost()}:${resolveConfig.port}`

  exports.push(`module.exports = "${origin}"`)

  return {
    code: exports.join('\r\n')
  }
}
