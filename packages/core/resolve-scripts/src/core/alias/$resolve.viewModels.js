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
    const name = viewModel.name

    const projection = resolveFile(viewModel.projection)

    const serializeState = resolveFile(
      viewModel.serializeState,
      'view_model_serialize_state.js'
    )

    const deserializeState = resolveFile(
      viewModel.deserializeState,
      'view_model_deserialize_state.js'
    )

    const validator = resolveFile(
      viewModel.validator,
      'view_model_validator.js'
    )

    const snapshotAdapter = viewModel.snapshotAdapter
      ? {
          module: resolveFileOrModule(viewModel.snapshotAdapter.module),
          options: {
            ...viewModel.snapshotAdapter.options
          }
        }
      : {}

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
