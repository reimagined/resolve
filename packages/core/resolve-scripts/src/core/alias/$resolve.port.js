import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.port`)
  }

  if (!resolveConfig.port) {
    throw new Error(`${message.configNotContainSectionError}.port`)
  }

  const exports = []

  if (checkRuntimeEnv(resolveConfig.port) != null) {
    exports.push(
      `const port = process.env[${JSON.stringify(resolveConfig.port)}]`,
      ``,
      `export default port`
    )
  } else {
    exports.push(
      `const port = ${JSON.stringify(resolveConfig.port)}`,
      ``,
      `export default port`
    )
  }

  return {
    code: exports.join('\r\n')
  }
}
