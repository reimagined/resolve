import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_ANY,
  IMPORT_INSTANCE
} from '../constants'
import importResource from '../import_resource'
import resolveFile from '../resolve_file'

export default ({ resolveConfig, isClient }) => {
  if (!isClient) {
    throw new Error(`${message.clientAliasInServerCodeError}.index`)
  }

  const imports = []
  const constants = []
  const exports = []

  const clientIndexPath = resolveFile(
    resolveConfig.index,
    'resolve-runtime/lib/common/defaults/client-index.js'
  )

  importResource({
    resourceName: `clientIndex`,
    resourceValue: resolveConfig.index,
    runtimeMode: RUNTIME_ENV_NOWHERE,
    importMode: RESOURCE_ANY,
    instanceMode: IMPORT_INSTANCE,
    instanceFallback: clientIndexPath,
    imports,
    constants
  })

  exports.push(`export default clientIndex`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
