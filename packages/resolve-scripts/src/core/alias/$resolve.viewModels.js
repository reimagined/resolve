import path from 'path'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  const imports = []
  const constants = [``]
  const exports = [``, `const viewModels = []`, ``]

  for (let index = 0; index < resolveConfig.viewModels.length; index++) {
    const viewModel = resolveConfig.viewModels[index]

    const name = viewModel.name

    const projection = resolveFile(viewModel.projection)

    let serializeState = path.resolve(
      __dirname,
      '../../runtime/common/view-models/serialize_state.js'
    )
    if (viewModel.serializeState) {
      serializeState = resolveFile(viewModel.serializeState)
    }

    let deserializeState = path.resolve(
      __dirname,
      '../../runtime/common/view-models/deserialize_state.js'
    )
    if (viewModel.deserializeState) {
      deserializeState = resolveFile(viewModel.deserializeState)
    }

    let validator = path.resolve(
      __dirname,
      '../../runtime/common/view-models/validator.js'
    )
    if (viewModel.validator) {
      validator = resolveFile(viewModel.validator)
    }

    const snapshotAdapter = viewModel.snapshot
      ? resolveFileOrModule(viewModel.snapshot.adapter)
      : undefined

    const snapshotOptions = viewModel.snapshot
      ? viewModel.snapshot.options
      : undefined

    imports.push(`import projection_${index} from "${projection}"`)

    if (!isClient) {
      imports.push(`import serializeState_${index} from "${serializeState}"`)
    }

    imports.push(`import deserializeState_${index} from "${deserializeState}"`)

    if (!isClient && viewModel.validator) {
      imports.push(`import validator_${index} from "${validator}"`)
    }

    if (!isClient && viewModel.snapshot) {
      imports.push(`import snapshotAdapter_${index} from "${snapshotAdapter}"`)
    }

    constants.push(`const name_${index} = ${JSON.stringify(name)}`)

    if (!isClient && viewModel.snapshot) {
      constants.push(
        `const snapshotOptions_${index} = ${JSON.stringify(snapshotOptions)}`
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
    if (!isClient && viewModel.snapshot) {
      exports.push(
        `, snapshot: {`,
        `    adapter: snapshotAdapter_${index},`,
        `    options: snapshotOptions_${index} `,
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
