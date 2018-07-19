import { envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFile from '../resolve_file'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.auth`)
  }

  if (!resolveConfig.auth) {
    throw new Error(`${message.configNotContainSectionError}.auth`)
  }

  if (resolveConfig.auth.strategies in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.auth.strategies`)
  }
  const strategies = resolveFile(
    resolveConfig.auth.strategies,
    'auth/strategies.js'
  )

  const exports = []

  exports.push(
    `import strategies from ${JSON.stringify(strategies)}`,
    ``,
    `const auth = {`,
    `  strategies`,
    `}`,
    ``,
    `export default auth`
  )

  return {
    code: exports.join('\r\n')
  }
}
