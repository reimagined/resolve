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
        module: resolveFileOrModule(resolveConfig.busAdapter.module),
        options: {
          ...resolveConfig.busAdapter.options
        }
      }
    : {}

  const exports = []

  exports.push(
    `import busAdapterModule from ${JSON.stringify(busAdapter.module)}`,
    ``,
    `const busAdapterOptions = ${injectEnv(busAdapter.options)}`
  )

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
