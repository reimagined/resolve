import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import { importResource } from '../import-resource'

const importUploadAdapter = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.seedClientEnvs`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = []
  const exports = [`export default uploadAdapter`]

  if (resolveConfig.hasOwnProperty('uploadAdapter')) {
    if (resolveConfig.uploadAdapter.module == null) {
      resolveConfig.uploadAdapter.module = {
        package: '@resolve-js/runtime',
        import: 'emptyUploadAdapter',
      }
    }

    importResource({
      resourceName: `uploadAdapter`,
      resourceValue: resolveConfig.uploadAdapter,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants,
    })
  } else {
    constants.push(`const uploadAdapter = null`)
  }

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importUploadAdapter
