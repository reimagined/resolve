import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_ANY,
  IMPORT_INSTANCE
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.readModels`
    )
  }

  const imports = []
  const constants = [``]
  const exports = [``, `const readModels = []`, ``]

  for (let index = 0; index < resolveConfig.readModels.length; index++) {
    const readModel = resolveConfig.readModels[index]

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
      `const connectorName_${index} = ${JSON.stringify(
        readModel.connectorName
      )}`
    )

    importResource({
      resourceName: `resolvers_${index}`,
      resourceValue: readModel.resolvers,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants
    })

    exports.push(`readModels.push({`, `  name: name_${index}`)
    exports.push(`, resolvers: resolvers_${index}`)
    exports.push(`, connectorName: connectorName_${index}`)

    importResource({
      resourceName: `projection_${index}`,
      resourceValue: readModel.projection,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      calculateHash: 'resolve-read-model-projection-hash',
      imports,
      constants
    })
    exports.push(`, projection: projection_${index}`)
    exports.push(`, invariantHash: projection_${index}_hash`)

    exports.push(`})`, ``)
  }

  exports.push(`export default readModels`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
