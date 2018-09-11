import crypto from 'crypto'
import fs from 'fs'

import { message } from '../constants'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import importBabel from '../import_babel'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

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

    if (checkRuntimeEnv(readModel.name)) {
      throw new Error(`${message.clientEnvError}.readModels[${index}].name`)
    }
    const name = readModel.name

    if (checkRuntimeEnv(readModel.projection)) {
      throw new Error(
        `${message.clientEnvError}.readModels[${index}].projection`
      )
    }
    const projection = resolveFile(readModel.projection)

    if (checkRuntimeEnv(readModel.resolvers)) {
      throw new Error(
        `${message.clientEnvError}.readModels[${index}].resolvers`
      )
    }
    const resolvers = resolveFile(readModel.resolvers)

    const hmac = crypto.createHmac(
      'sha512',
      'resolve-read-model-projection-hash'
    )
    hmac.update(fs.readFileSync(projection).toString())
    const invariantHash = hmac.digest('hex')

    constants.push(
      `const invariantHash_${index} = ${JSON.stringify(invariantHash)}`
    )

    const adapter = readModel.adapter
      ? {
          module: checkRuntimeEnv(readModel.adapter.module)
            ? readModel.adapter.module
            : resolveFileOrModule(readModel.adapter.module),
          options: {
            ...readModel.adapter.options
          }
        }
      : {
          module: resolveFileOrModule('resolve-readmodel-memory'),
          options: {}
        }

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

    if (!isClient) {
      if (checkRuntimeEnv(adapter.module)) {
        constants.push(
          `const adapter_${index} = ${injectRuntimeEnv(adapter)}`,
          `const adapterModule_${index} = interopRequireDefault(`,
          `  __non_webpack_require__(adapter_${index}.module)`,
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
      exports.push(`, invariantHash: invariantHash_${index}`)
    }
    exports.push(`, resolvers: resolvers_${index}`)
    if (!isClient) {
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
