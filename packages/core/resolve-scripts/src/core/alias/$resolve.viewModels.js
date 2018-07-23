import path from 'path'
import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.viewModels) {
    throw new Error(`${message.configNotContainSectionError}.viewModels`)
  }

  const imports = [
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``
  ]
  const constants = []
  const exports = [`const viewModels = []`, ``]

  for (let index = 0; index < resolveConfig.viewModels.length; index++) {
    const viewModel = resolveConfig.viewModels[index]

    if (viewModel.name in resolveConfig[envKey]) {
      throw new Error(`${message.clientEnvError}.viewModels[${index}].name`)
    }
    const name = viewModel.name

    if (viewModel.projection in resolveConfig[envKey]) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].projection`
      )
    }
    const projection = resolveFile(viewModel.projection)

    if (viewModel.serializeState in resolveConfig[envKey]) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].serializeState`
      )
    }
    const serializeState = viewModel.serializeState
      ? resolveFile(viewModel.serializeState)
      : path.resolve(
          __dirname,
          '../../runtime/common/view-models/serialize_state.js'
        )

    if (viewModel.deserializeState in resolveConfig[envKey]) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].deserializeState`
      )
    }
    const deserializeState = viewModel.deserializeState
      ? resolveFile(viewModel.deserializeState)
      : path.resolve(
          __dirname,
          '../../runtime/common/view-models/deserialize_state.js'
        )

    if (viewModel.validator in resolveConfig[envKey]) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].validator`
      )
    }
    const validator = viewModel.validator
      ? resolveFile(viewModel.validator)
      : path.resolve(__dirname, '../../runtime/common/view-models/validator.js')

    const snapshotAdapter = viewModel.snapshotAdapter
      ? {
          module:
            viewModel.snapshotAdapter.module in resolveConfig[envKey]
              ? viewModel.snapshotAdapter.module
              : resolveFileOrModule(viewModel.snapshotAdapter.module),
          options: {
            ...viewModel.snapshotAdapter.options
          }
        }
      : {}
    Object.defineProperty(snapshotAdapter, envKey, {
      value: resolveConfig[envKey]
    })

    imports.push(
      `import projection_${index} from ${JSON.stringify(projection)}`
    )

    if (!isClient) {
      imports.push(
        `import serializeState_${index} from ${JSON.stringify(serializeState)}`
      )
    }

    imports.push(
      `import deserializeState_${index} from ${JSON.stringify(
        deserializeState
      )}`
    )

    if (!isClient && viewModel.validator) {
      imports.push(
        `import validator_${index} from ${JSON.stringify(validator)}`
      )
    }

    imports.push(``)

    constants.push(`const name_${index} = ${JSON.stringify(name)}`)

    if (!isClient && viewModel.snapshotAdapter) {
      if (viewModel.snapshotAdapter.module in resolveConfig[envKey]) {
        constants.push(
          `const snapshotAdapter_${index} = ${injectEnv(snapshotAdapter)}`,
          `const snapshotAdapterModule_${index} = interopRequireDefault(`,
          `  eval('require(snapshotAdapter_${index}.module)')`,
          `).default`,
          `const snapshotAdapterOptions_${index} = snapshotAdapter_${index}.options`
        )
      } else {
        imports.push(
          `import snapshotAdapterModule_${index} from ${JSON.stringify(
            snapshotAdapter.module
          )}`
        )
        constants.push(
          `const snapshotAdapterOptions_${index} = ${injectEnv(
            snapshotAdapter.options
          )}`
        )
      }
    }

    exports.push(
      `viewModels.push({`,
      `  name: name_${index}`,
      `, projection: projection_${index}`
    )

    if (!isClient) {
      exports.push(`, serializeState: serializeState_${index}`)
    }

    exports.push(`, deserializeState: deserializeState_${index}`)

    if (!isClient && viewModel.validator) {
      exports.push(`, validator: validator_${index}`)
    }
    if (!isClient && viewModel.snapshotAdapter) {
      exports.push(
        `, snapshotAdapter: {`,
        `    module: snapshotAdapterModule_${index},`,
        `    options: snapshotAdapterOptions_${index} `,
        `  }`
      )
    }

    exports.push(`})`, ``)
  }

  exports.push(`export default viewModels`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
