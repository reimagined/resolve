import { envKey } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.staticDir`)
  }

  if (!resolveConfig.distDir) {
    throw new Error(`${message.configNotContainSectionError}.staticDir`)
  }

  if (resolveConfig.distDir in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.staticDir`)
  }

  const exports = []

  exports.push(
    `const staticDir = ${JSON.stringify(resolveConfig.staticDir, null, 2)}`,
    ``,
    `export default staticDir`
  )

  return {
    code: exports.join('\r\n')
  }
}
