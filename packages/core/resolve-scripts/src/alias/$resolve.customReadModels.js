import {
  message,
  RUNTIME_ENV_ANYWHERE,
  RESOURCE_ANY,
  IMPORT_INSTANCE
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}.customReadModels`)
  }
  if (!resolveConfig.customReadModels) {
    throw new Error(`${message.configNotContainSectionError}.customReadModels`)
  }

  const imports = []
  const constants = [``]
  const exports = [``, `const customReadModels = []`, ``]

  for (let index = 0; index < resolveConfig.customReadModels.length; index++) {
    const customReadModel = resolveConfig.customReadModels[index]

    if (checkRuntimeEnv(customReadModel.name)) {
      throw new Error(
        `${message.clientEnvError}.customReadModels[${index}].name`
      )
    }
    constants.push(
      `const name_${index} = ${JSON.stringify(customReadModel.name)}`
    )

    exports.push(`customReadModels.push({`, `  name: name_${index}`)

    importResource({
      resourceName: `updateByEvents_${index}`,
      resourceValue: customReadModel.updateByEvents,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants
    })

    exports.push(`, updateByEvents: updateByEvents_${index}`)

    importResource({
      resourceName: `read_${index}`,
      resourceValue: customReadModel.read,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants
    })

    exports.push(`, read: read_${index}`)

    if (customReadModel.readAndSerialize != null) {
      importResource({
        resourceName: `readAndSerialize_${index}`,
        resourceValue: customReadModel.readAndSerialize,
        runtimeMode: RUNTIME_ENV_ANYWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })
    } else {
      constants.push(
        `const readAndSerialize_${index} = async (...args) => {`,
        `  const result = await read_${index}(...args)`,
        `  return JSON.stringify(result, null, 2)`,
        `}`
      )
    }

    exports.push(`, readAndSerialize: readAndSerialize_${index}`)

    if (customReadModel.getLastError != null) {
      importResource({
        resourceName: `getLastError_${index}`,
        resourceValue: customReadModel.getLastError,
        runtimeMode: RUNTIME_ENV_ANYWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })
    } else {
      constants.push(`const getLastError_${index} = async () => null`)
    }

    exports.push(`, getLastError: getLastError_${index}`)

    if (customReadModel.dispose != null) {
      importResource({
        resourceName: `dispose_${index}`,
        resourceValue: customReadModel.dispose,
        runtimeMode: RUNTIME_ENV_ANYWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })
    } else {
      constants.push(`const dispose_${index} = async () => null`)
    }

    exports.push(`, dispose: dispose_${index}`)

    exports.push(`})`, ``)
  }

  exports.push(`export default customReadModels`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
