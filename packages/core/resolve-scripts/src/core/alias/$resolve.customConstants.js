import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (resolveConfig.customConstants == null) {
    throw new Error(`${message.configNotContainSectionError}.customConstants`)
  }

  for (const key of Object.keys(resolveConfig.customConstants)) {
    if (checkRuntimeEnv(resolveConfig.customConstants[key])) {
    }
  }

  const customConstants = JSON.stringify(
    resolveConfig.customConstants,
    (key, value) => {
      if (checkRuntimeEnv(value)) {
        throw new Error(`${message.clientEnvError}".${key}"`)
      }

      if (
        value == null ||
        value.constructor === Number ||
        value.constructor === String ||
        value.constructor === Boolean ||
        Array.isArray(value) ||
        value.constructor === Object
      ) {
        return value
      } else {
        throw new Error(`${message.incorrectJsonSchemaType}".${key}"`)
      }
    },
    2
  )

  const exports = []

  exports.push(
    `const customConstants = ${customConstants}`,
    ``,
    `module.exports = customConstants`
  )

  return {
    code: exports.join('\r\n')
  }
}
