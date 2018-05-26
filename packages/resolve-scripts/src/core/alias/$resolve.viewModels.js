import path from 'path'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'

export default ({ resolveConfig, isClient }) => {
  const imports = []
  const consts = [``]
  const viewModels = [``, `const viewModels = []`, ``]

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

    consts.push(`const name_${index} = ${JSON.stringify(name)}`)

    if (!isClient && viewModel.snapshot) {
      consts.push(
        `const snapshotOptions_${index} = ${JSON.stringify(snapshotOptions)}`
      )
    }

    viewModels.push(
      `viewModels.push({`,
      `  name: name_${index}`,
      `, projection: projection_${index}`
    )

    if (!isClient) {
      viewModels.push(`, serializeState: serializeState_${index}`)
    }

    viewModels.push(`, deserializeState: deserializeState_${index}`)

    if (!isClient && viewModel.validator) {
      viewModels.push(`, validator: validator_${index}`)
    }
    if (!isClient && viewModel.snapshot) {
      viewModels.push(
        `, snapshot: {`,
        `    adapter: snapshotAdapter_${index},`,
        `    options: snapshotOptions_${index} `,
        `  }`
      )
    }

    viewModels.push(`})`, ``)
  }

  viewModels.push(`export default viewModels`)

  return {
    code: [...imports, ...consts, ...viewModels].join('\r\n')
  }
}
