import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.busAdapter`
    )
  }

  if (!resolveConfig.busAdapter) {
    throw new Error(`${message.configNotContainSectionError}.busAdapter`)
  }

  const busAdapter = resolveConfig.busAdapter
    ? {
        module:
          resolveConfig.busAdapter.module in resolveConfig[envKey]
            ? resolveConfig.busAdapter.module
            : resolveFileOrModule(resolveConfig.busAdapter.module),
        options: {
          ...resolveConfig.busAdapter.options
        }
      }
    : {}
  Object.defineProperty(busAdapter, envKey, { value: resolveConfig[envKey] })

  const exports = []

  if (busAdapter.module in resolveConfig[envKey]) {
    exports.push(
      `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
      ``,
      `const busAdapter = ${injectEnv(busAdapter)}`,
      `const busAdapterModule = interopRequireDefault(`,
      `  eval('require(busAdapter.module)')`,
      `).default`,
      `const busAdapterOptions = busAdapter.options`
    )
  } else {
    exports.push(
      `import busAdapterModule from ${JSON.stringify(busAdapter.module)}`,
      ``,
      `const busAdapterOptions = ${injectEnv(busAdapter.options)}`
    )
  }

  exports.push(
    ``,
    `export default {`,
    `  module: busAdapterModule,`,
    `  options: busAdapterOptions`,
    `}`
  )

  return {
    code: exports.join('\r\n')
  }
}
