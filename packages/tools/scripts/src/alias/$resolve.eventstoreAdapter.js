import {
  message,
  RESOURCE_CONSTRUCTOR_ONLY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import { importResource } from '../import-resource'

const importEventstoreAdapter = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.eventstoreAdapter`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = []
  const exports = []

  importResource({
    resourceName: 'eventstoreAdapter',
    resourceValue: resolveConfig.eventstoreAdapter,
    runtimeMode: RUNTIME_ENV_ANYWHERE,
    importMode: RESOURCE_CONSTRUCTOR_ONLY,
    instanceMode: IMPORT_CONSTRUCTOR,
    imports,
    constants,
  })

  exports.push('export default eventstoreAdapter')

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importEventstoreAdapter
