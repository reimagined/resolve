import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.storageAdapter`
    )
  }

  if (!resolveConfig.storageAdapter) {
    throw new Error(`${message.configNotContainSectionError}.storageAdapter`)
  }

  const storageAdapter = resolveConfig.storageAdapter
    ? {
        module:
          resolveConfig.storageAdapter.module in resolveConfig[envKey]
            ? resolveConfig.storageAdapter.module
            : resolveFileOrModule(resolveConfig.storageAdapter.module),
        options: {
          ...resolveConfig.storageAdapter.options
        }
      }
    : {}
  Object.defineProperty(storageAdapter, envKey, {
    value: resolveConfig[envKey]
  })

  const exports = []

  exports.push(
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``,
    `const storageAdapter = ${injectEnv(storageAdapter)}`,
    `const storageAdapterModule = interopRequireDefault(`,
    `  eval('require(storageAdapter.module)')`,
    `).default`,
    `const storageAdapterOptions = storageAdapter.options`,
    ``,
    `export default {`,
    `  module: storageAdapterModule,`,
    `  options: storageAdapterOptions`,
    `}`
  )

  return {
    code: exports.join('\r\n')
  }
}
