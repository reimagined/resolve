import { message } from '../constants'
import resolveFileOrModule from '../resolve_file_or_module'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

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
        module: checkRuntimeEnv(resolveConfig.busAdapter.module)
          ? resolveConfig.busAdapter.module
          : resolveFileOrModule(resolveConfig.busAdapter.module),
        options: {
          ...resolveConfig.busAdapter.options
        }
      }
    : {}

  const exports = []

  if (checkRuntimeEnv(busAdapter.module)) {
    exports.push(
      `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
      ``,
      `const busAdapter = ${injectRuntimeEnv(busAdapter)}`,
      `const busAdapterModule = interopRequireDefault(`,
      `  __non_webpack_require__(busAdapter.module)`,
      `).default`,
      `const busAdapterOptions = busAdapter.options`
    )
  } else {
    exports.push(
      `import busAdapterModule from ${JSON.stringify(busAdapter.module)}`,
      ``,
      `const busAdapterOptions = ${JSON.stringify(busAdapter.options)}`
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
