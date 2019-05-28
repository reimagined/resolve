import { message } from '../constants'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  void JSON.stringify(resolveConfig.customConstants, (key, value) => {
    if (
      value != null &&
      value.constructor !== Number &&
      value.constructor !== String &&
      value.constructor !== Boolean &&
      !Array.isArray(value) &&
      value.constructor !== Object &&
      !checkRuntimeEnv(value)
    ) {
      throw new Error(`${message.incorrectJsonSchemaType}".${key}"`)
    }

    return value
  })

  const exports = []

  exports.push(
    `const customConstants = ${injectRuntimeEnv(
      resolveConfig.customConstants,
      isClient
    )}`,
    ``,
    `module.exports = customConstants`
  )

  return {
    code: exports.join('\r\n')
  }
}
