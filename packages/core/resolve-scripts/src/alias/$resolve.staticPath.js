import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (resolveConfig.staticPath == null) {
    throw new Error(`${message.configNotContainSectionError}.staticPath`)
  }

  const exports = []

  if (!checkRuntimeEnv(resolveConfig.staticPath)) {
    exports.push(
      `const staticPath = ${JSON.stringify(resolveConfig.staticPath)}`,
      ``,
      `export default staticPath`
    )
  } else {
    exports.push(
      `const staticPath = ${injectRuntimeEnv(
        resolveConfig.staticPath,
        isClient
      )}`,
      ``,
      `export default staticPath`
    )
  }

  return {
    code: exports.join('\r\n')
  }
}
