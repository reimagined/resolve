import getLocalHost from 'my-local-ip'

export default ({ resolveConfig }) => {
  const exports = []

  const origin =
    process.env.RESOLVE_ORIGIN ||
    `http://${getLocalHost()}:${resolveConfig.port}`

  exports.push(`module.exports = "${origin}"`)

  return {
    code: exports.join('\r\n')
  }
}
