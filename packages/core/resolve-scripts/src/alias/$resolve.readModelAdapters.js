import {
  message,
  RESOURCE_CONSTRUCTOR_ONLY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.readModelAdapters) {
    throw new Error(`${message.configNotContainSectionError}.readModelAdapters`)
  }
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}.readModelAdapters`)
  }

  const imports = []
  const constants = [``]
  const exports = [`const readModelAdapters = []`]

  for (let index = 0; index < resolveConfig.readModelAdapters.length; index++) {
    const readModelAdapter = resolveConfig.readModelAdapters[index]

    if (checkRuntimeEnv(readModelAdapter.name)) {
      throw new Error(
        `${message.clientEnvError}.readModelAdapters[${index}].name`
      )
    }
    constants.push(
      `const name_${index} = ${JSON.stringify(readModelAdapter.name)}`
    )

    importResource({
      resourceName: `factory_${index}`,
      resourceValue: {
        module: readModelAdapter.module,
        options: readModelAdapter.options
      },
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_CONSTRUCTOR_ONLY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants
    })

    exports.push(`readModelAdapters.push({
        name: name_${index},
        factory: factory_${index}
        })`)
  }

  exports.push(`export default readModelAdapters`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
