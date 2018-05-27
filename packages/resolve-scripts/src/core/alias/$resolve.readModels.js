import { injectEnv } from 'json-env-extract'

import { message } from '../constants'
import resolveFile from '../resolve_file'
import importBabel from '../import_babel'

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

    const name = readModel.name

    const projection = resolveFile(readModel.projection)

    const resolvers = resolveFile(readModel.resolvers)

    const storage = readModel.storage

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

    if (!isClient && readModel.storage) {
      constants.push(
        `const storage_${index} = ${injectEnv(storage)}`,
        `const storageAdapter_${index} = interopRequireDefault(`,
        `  require(storage_${index}.adapter)`,
        `).default`,
        `const storageOptions_${index} = storage_${index}.options`
      )
    }

    exports.push(`readModels.push({`, `  name: name_${index}`)
    if (!isClient) {
      exports.push(`, projection: projection_${index}`)
    }
    exports.push(`, resolvers: resolvers_${index}`)
    if (!isClient && readModel.storage) {
      exports.push(
        `, snapshot: {`,
        `    adapter: storageAdapter_${index},`,
        `    options: storageOptions_${index}`,
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
