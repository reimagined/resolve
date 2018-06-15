import { envKey } from 'json-env-extract'

import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.staticPath`
    )
  }

  if (resolveConfig.staticPath == null) {
    throw new Error(`${message.configNotContainSectionError}.staticPath`)
  }

  if (resolveConfig.staticPath in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.staticPath`)
  }

  const exports = []

  exports.push(
    `const staticPath = ${JSON.stringify(resolveConfig.staticPath, null, 2)}`,
    ``,
    `export default staticPath`
  )

  return {
    code: exports.join('\r\n')
  }
}
