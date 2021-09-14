import loaderUtils from 'loader-utils'
import {
  message,
  RUNTIME_ENV_NOWHERE,
  RUNTIME_ENV_OPTIONS_ONLY,
  RESOURCE_ANY,
  IMPORT_INSTANCE,
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import { importResource } from '../import-resource'

const importReadModel = ({ resolveConfig, isClient }, resourceQuery) => {
  if (!/^\?/.test(resourceQuery)) {
    throw new Error(
      `Resource $resolve.readModel should be retrieved with resource query`
    )
  }
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.readModels`
    )
  }

  const { readModelName, onlyProjection } = loaderUtils.parseQuery(
    resourceQuery
  )
  let readModel = null
  let index = -1
  for (
    let currentIndex = 0;
    currentIndex < resolveConfig.readModels.length;
    currentIndex++
  ) {
    if (resolveConfig.readModels[currentIndex].name === readModelName) {
      readModel = resolveConfig.readModels[currentIndex]
      index = currentIndex
    }
  }

  if (readModelName == null || readModel == null || index < 0) {
    throw new Error(
      `Read-model ${readModelName} does not exist (readModels[${index}])`
    )
  }

  const imports = []
  const constants = []
  const exports = []

  if (checkRuntimeEnv(readModel.name)) {
    throw new Error(`${message.clientEnvError}.readModels[${index}].name`)
  }
  constants.push(`const name_${index} = ${JSON.stringify(readModel.name)}`)

  if (checkRuntimeEnv(readModel.connectorName)) {
    throw new Error(
      `${message.clientEnvError}.readModels[${index}].connectorName`
    )
  }
  constants.push(
    `const connectorName_${index} = ${JSON.stringify(readModel.connectorName)}`
  )

  if (!onlyProjection) {
    importResource({
      resourceName: `resolvers_${index}`,
      resourceValue: readModel.resolvers,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants,
    })
  }

  exports.push(`const readModel = {`, `  name: name_${index}`)
  if (!onlyProjection) {
    exports.push(`, resolvers: resolvers_${index}`)
  }
  exports.push(`, connectorName: connectorName_${index}`)

  importResource({
    resourceName: `projection_${index}`,
    resourceValue: readModel.projection,
    runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
    importMode: RESOURCE_ANY,
    instanceMode: IMPORT_INSTANCE,
    ...(!onlyProjection
      ? { calculateHash: 'resolve-read-model-projection-hash' }
      : {}),
    imports,
    constants,
  })
  exports.push(`, projection: projection_${index}`)

  if (!onlyProjection) {
    exports.push(`, invariantHash: projection_${index}_hash`)

    importResource({
      resourceName: `encryption_${index}`,
      resourceValue: readModel.encryption,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback: '@resolve-js/runtime/lib/common/defaults/encryption.js',
      imports,
      constants,
    })
    exports.push(`, encryption: encryption_${index}`)
  }

  exports.push(`}`, ``)

  exports.push(`export default readModel`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importReadModel
