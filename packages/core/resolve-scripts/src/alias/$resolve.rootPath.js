import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (resolveConfig.rootPath == null) {
    throw new Error(`${message.configNotContainSectionError}.rootPath`)
  }

  const rootPath = resolveConfig.rootPath
  const exports = []

  if (!checkRuntimeEnv(rootPath)) {
    exports.push(
      `const rootPath = ${JSON.stringify(rootPath)}`,
      ``,
      `export default rootPath`
    )
  } else {
    exports.push(
      `const rootPath = ${injectRuntimeEnv(rootPath, isClient)}`,
      ``,
      `export default rootPath`
    )
  }

  return {
    code: exports.join('\r\n')
  }
}
