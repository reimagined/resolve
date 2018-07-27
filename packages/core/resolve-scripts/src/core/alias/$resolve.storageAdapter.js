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
        module: resolveFileOrModule(resolveConfig.storageAdapter.module),
        options: {
          ...resolveConfig.storageAdapter.options
        }
      }
    : {}

  const exports = []

  exports.push(
    `import storageAdapterModule from ${JSON.stringify(storageAdapter.module)}`,
    ``,
    `const storageAdapterOptions = ${JSON.stringify(storageAdapter.options)}`
  )

  exports.push(
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
