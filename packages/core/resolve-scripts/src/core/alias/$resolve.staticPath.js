import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (resolveConfig.staticPath == null || resolveConfig.staticPath === '') {
    throw new Error(`${message.configNotContainSectionError}.staticPath`)
  }

  if (checkRuntimeEnv(resolveConfig.staticPath)) {
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
