import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_CONSTRUCTOR_ONLY,
  IMPORT_CONSTRUCTOR
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.subscribeAdapter) {
    throw new Error(`${message.configNotContainSectionError}.subscribeAdapter`)
  }

  if (
    resolveConfig.subscribeAdapter.module == null ||
    resolveConfig.subscribeAdapter.module.constructor !== String
  ) {
    throw new Error(
      `${message.configNotContainSectionError}.subscribeAdapter.module`
    )
  }

  if (checkRuntimeEnv(resolveConfig.subscribeAdapter.module)) {
    throw new Error(`${message.message.clientEnvError}.subscribeAdapter.module`)
  }

  const imports = []
  const constants = []
  const exports = []

  if (!isClient) {
    throw new Error(
      `${message.clientAliasInServerCodeError}.subscribeAdapter.module`
    )
  }

  importResource({
    resourceName: `subscribe_adapter`,
    resourceValue: resolveConfig.subscribeAdapter,
    runtimeMode: RUNTIME_ENV_NOWHERE,
    importMode: RESOURCE_CONSTRUCTOR_ONLY,
    instanceMode: IMPORT_CONSTRUCTOR,
    imports,
    constants
  })

  exports.push(`export default subscribe_adapter`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
