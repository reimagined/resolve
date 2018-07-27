import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.port`)
  }

  if (!resolveConfig.port) {
    throw new Error(`${message.configNotContainSectionError}.port`)
  }

  const config = {
    port: resolveConfig.port
  }

  const exports = []

  exports.push(
    `const config = ${JSON.stringify(config)}`,
    ``,
    `const port = config.port`,
    ``,
    `export default port`
  )

  return {
    code: exports.join('\r\n')
  }
}
