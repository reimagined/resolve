import {
  message,
  RESOURCE_CONSTRUCTOR_ONLY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR
} from '../constants'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.storageAdapter`
    )
  }

  const imports = []
  const constants = []
  const exports = []

  importResource({
    resourceName: 'storageAdapter',
    resourceValue: resolveConfig.storageAdapter,
    runtimeMode: RUNTIME_ENV_ANYWHERE,
    importMode: RESOURCE_CONSTRUCTOR_ONLY,
    instanceMode: IMPORT_CONSTRUCTOR,
    imports,
    constants
  })

  exports.push('export default storageAdapter')

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
