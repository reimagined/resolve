import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

const importStaticDir = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.staticDir`)
  }

  if (checkRuntimeEnv(resolveConfig.staticDir)) {
    throw new Error(`${message.clientEnvError}.staticDir`)
  }

  const exports = []

  exports.push(
    `const staticDir = ${JSON.stringify(resolveConfig.staticDir, null, 2)}`,
    ``,
    `export default staticDir`
  )

  return exports.join('\r\n')
}

export default importStaticDir
