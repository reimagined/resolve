import { injectEnv, envKey } from 'json-env-extract'

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
  Object.defineProperty(config, envKey, { value: resolveConfig[envKey] })

  const exports = []

  exports.push(
    `const config = ${injectEnv(config)}`,
    ``,
    `const port = config.port`,
    ``,
    `export default port`
  )

  return {
    code: exports.join('\r\n')
  }
}
