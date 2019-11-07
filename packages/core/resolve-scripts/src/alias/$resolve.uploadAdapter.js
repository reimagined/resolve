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
      `${message.serverAliasInClientCodeError}$resolve.uploadAdapter`
    )
  }

  if (resolveConfig.hasOwnProperty('uploadAdapter')) {
    const imports = [`import '$resolve.guardOnlyServer'`]
    const constants = []
    const exports = []

    importResource({
      resourceName: 'uploadAdapter',
      resourceValue: resolveConfig.uploadAdapter,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_CONSTRUCTOR_ONLY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants
    })

    exports.push('export default uploadAdapter')

    return [...imports, ...constants, ...exports].join('\r\n')
  }

  return ''
}
