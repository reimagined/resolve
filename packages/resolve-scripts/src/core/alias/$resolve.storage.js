import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.storage`)
  }

  if (!resolveConfig.storage) {
    throw new Error(`${message.configNotContainSectionError}.storage`)
  }

  const storage = resolveConfig.storage
    ? {
        adapter:
          resolveConfig.storage.adapter in resolveConfig[envKey]
            ? resolveConfig.storage.adapter
            : resolveFileOrModule(resolveConfig.storage.adapter),
        options: {
          ...resolveConfig.storage.options
        }
      }
    : {}
  Object.defineProperty(storage, envKey, { value: resolveConfig[envKey] })

  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``,
    `const storage = ${injectEnv(storage)}`,
    `const adapter = interopRequireDefault(eval('require(storage.adapter)')).default`,
    `const options = storage.options`,
    ``,
    `export default { adapter, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
