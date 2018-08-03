import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (resolveConfig.rootPath === undefined) {
    throw new Error(`${message.configNotContainSectionError}.rootPath`)
  }

  if (checkRuntimeEnv(resolveConfig.rootPath)) {
    throw new Error(`${message.clientEnvError}.rootPath`)
  }
  const rootPath = resolveConfig.rootPath

  const exports = []

  exports.push(
    `const rootPath = ${JSON.stringify(rootPath)}`,
    ``,
    `export default rootPath`
  )

  return {
    code: exports.join('\r\n')
  }
}
