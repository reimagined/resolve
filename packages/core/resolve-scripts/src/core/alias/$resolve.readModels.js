import { message } from '../constants'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import importBabel from '../import_babel'
import { checkRuntimeEnv } from '../declare_runtime_env' 

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.readModels) {
    throw new Error(`${message.configNotContainSectionError}.readModels`)
  }

  const imports = [
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``
  ]
  const constants = [``]
  const exports = [``, `const readModels = []`, ``]

  for (let index = 0; index < resolveConfig.readModels.length; index++) {
    const readModel = resolveConfig.readModels[index]

    if (checkRuntimeEnv(readModel.name) != null) {
      throw new Error(`${message.clientEnvError}.readModels[${index}].name`)
    }
    const name = readModel.name

    if (checkRuntimeEnv(readModel.projection) != null) {
      throw new Error(
        `${message.clientEnvError}.readModels[${index}].projection`
      )
    }
    const projection = resolveFile(readModel.projection)

    if (checkRuntimeEnv(readModel.resolvers) != null) {
      throw new Error(
        `${message.clientEnvError}.readModels[${index}].resolvers`
      )
    }
    const resolvers = resolveFile(readModel.resolvers)

    const adapter = readModel.adapter
      ? {
          module: checkRuntimeEnv(readModel.adapter.module) != null
            ? readModel.adapter.module
            : resolveFileOrModule(readModel.adapter.module),
          options: {
            ...readModel.adapter.options
          }
        }
      : {}

    constants.push(`const name_${index} = ${JSON.stringify(name)}`)

    if (isClient) {
      const clientResolvers = Object.keys(importBabel(resolvers))

      constants.push(
        `const resolvers_${index} = {`,
        clientResolvers
          .map(commandName => `  ${commandName}() {}`)
          .join(',\r\n'),
        `}`
      )
    } else {
      imports.push(
        `import projection_${index} from ${JSON.stringify(projection)}`,
        `import resolvers_${index} from ${JSON.stringify(resolvers)}`,
        ``
      )
    }

    if (!isClient && readModel.adapter) {
      if (checkRuntimeEnv(readModel.adapter.module) != null) {
        constants.push(
          `const adapter_${index} = ${JSON.stringify(adapter)}`,
          `const adapterModule_${index} = interopRequireDefault(`,
          `  eval('require(adapter_${index}.module)')`,
          `).default`,
          `const adapterOptions_${index} = adapter_${index}.options`
        )
      } else {
        imports.push(
          `import adapterModule_${index} from ${JSON.stringify(adapter.module)}`
        )
        constants.push(
          `const adapterOptions_${index} = ${JSON.stringify(adapter.options)}`
        )
      }
    }

    exports.push(`readModels.push({`, `  name: name_${index}`)
    if (!isClient) {
      exports.push(`, projection: projection_${index}`)
    }
    exports.push(`, resolvers: resolvers_${index}`)
    if (!isClient && readModel.adapter) {
      exports.push(
        `, adapter: {`,
        `    module: adapterModule_${index},`,
        `    options: adapterOptions_${index}`,
        `  }`
      )
    }
    exports.push(`})`, ``)
  }

  exports.push(`export default readModels`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
