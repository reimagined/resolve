import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_ANY,
  RESOURCE_CONSTRUCTOR_ONLY,
  RUNTIME_ENV_ANYWHERE
} from '../constants'
import importBabel from '../import_babel'
import { checkRuntimeEnv } from '../declare_runtime_env'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.readModels) {
    throw new Error(`${message.configNotContainSectionError}.readModels`)
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

    importResource({
      resourceName: `resolvers_${index}`,
      resourceValue: readModel.resolvers,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      imports: !isClient ? imports : [],
      constants: !isClient ? constants : []
    })

    if (isClient) {
      const clientResolvers =
        readModel.resolvers.constructor === String
          ? Object.keys(importBabel(resolveFile(readModel.resolvers)))
          : importBabel(resolveFileOrModule(readModel.resolvers.module))(
              readModel.resolvers.options,
              readModel.resolvers.imports != null
                ? Object.keys(readModel.resolvers.imports).reduce(
                    (acc, key) => {
                      acc[key] = importBabel(
                        resolveFile(readModel.resolvers.imports[key])
                      )
                      return acc
                    },
                    {}
                  )
                : null
            )

      constants.push(
        `const resolvers_${index} = {`,
        clientResolvers
          .map(commandName => `  ${commandName}() {}`)
          .join(',\r\n'),
        `}`
      )
    }

    const readModelAdapter = readModel.hasOwnProperty('adapter')
      ? readModel.adapter
      : {
          module: 'resolve-readmodel-memory',
          options: {}
        }

    exports.push(`readModels.push({`, `  name: name_${index}`)
    exports.push(`, resolvers: resolvers_${index}`)

    if (!isClient) {
      importResource({
        resourceName: `projection_${index}`,
        resourceValue: readModel.projection,
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        calculateHash: 'resolve-read-model-projection-hash',
        imports,
        constants
      })
      exports.push(`, projection: projection_${index}`)
      exports.push(`, invariantHash: projection_${index}_hash`)

      importResource({
        resourceName: `read_model_adapter_${index}`,
        resourceValue: readModelAdapter,
        runtimeMode: RUNTIME_ENV_ANYWHERE,
        importMode: RESOURCE_CONSTRUCTOR_ONLY,
        imports,
        constants
      })

      exports.push(`, adapter: read_model_adapter_${index}`)
    }
    exports.push(`})`, ``)
  }

  exports.push(`export default readModels`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
