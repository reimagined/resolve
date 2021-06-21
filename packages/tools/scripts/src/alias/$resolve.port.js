import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

const importPort = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.port`)
  }

  const exports = []

  if (checkRuntimeEnv(resolveConfig.port)) {
    exports.push(
      `const port = ${injectRuntimeEnv(resolveConfig.port)}`,
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

  return exports.join('\r\n')
}

export default importPort
