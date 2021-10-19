import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

const importDistDir = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.distDir`)
  }

  if (checkRuntimeEnv(resolveConfig.distDir)) {
    throw new Error(`${message.clientEnvError}.distDir`)
  }

  const exports = []

  exports.push(
    `const distDir = ${JSON.stringify(resolveConfig.distDir, null, 2)}`,
    ``,
    `export default distDir`
  )

  return exports.join('\r\n')
}

export default importDistDir
