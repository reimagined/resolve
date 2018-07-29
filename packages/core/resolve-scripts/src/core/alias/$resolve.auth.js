import { message } from '../constants'
import resolveFile from '../resolve_file'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.auth`)
  }

  if (!resolveConfig.auth) {
    throw new Error(`${message.configNotContainSectionError}.auth`)
  }
  
  if (checkRuntimeEnv(resolveConfig.auth.strategies) != null) {
    throw new Error(`${message.clientEnvError}.auth.strategies`)
  }

  const strategies = resolveFile(
    resolveConfig.auth.strategies,
    'auth_strategies.js'
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
