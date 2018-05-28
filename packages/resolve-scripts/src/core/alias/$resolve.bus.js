import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.bus`)
  }

  if (!resolveConfig.bus) {
    throw new Error(`${message.configNotContainSectionError}.bus`)
  }

  const bus = resolveConfig.bus
    ? {
        adapter:
          resolveConfig.bus.adapter in resolveConfig[envKey]
            ? resolveConfig.bus.adapter
            : resolveFileOrModule(resolveConfig.bus.adapter),
        options: {
          ...resolveConfig.bus.options
        }
      }
    : {}
  Object.defineProperty(bus, envKey, { value: resolveConfig[envKey] })

  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``,
    `const bus = ${injectEnv(bus)}`,
    `const adapter = interopRequireDefault(eval('require(bus.adapter)')).default`,
    `const options = bus.options`,
    ``,
    `export default { adapter, options }`
  )

  return {
    code: exports.join('\r\n')
  }
}
