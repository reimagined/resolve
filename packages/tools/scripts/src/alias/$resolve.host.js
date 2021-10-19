import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

const importPort = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.host`)
  }

  const exports = []

  if (checkRuntimeEnv(resolveConfig.host)) {
    exports.push(
      `const host = ${injectRuntimeEnv(resolveConfig.host)}`,
      ``,
      `export default host`
    )
  } else {
    exports.push(
      `const host = ${JSON.stringify(resolveConfig.host)}`,
      ``,
      `export default host`
    )
  }

  return exports.join('\r\n')
}

export default importPort
