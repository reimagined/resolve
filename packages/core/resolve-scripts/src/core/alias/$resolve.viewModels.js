import crypto from 'crypto'
import fs from 'fs'

import { message } from '../constants'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import { checkRuntimeEnv, injectRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.viewModels) {
    throw new Error(`${message.configNotContainSectionError}.viewModels`)
  }

  const imports = [
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``
  ]

  const constants = [
    `let AsyncGeneratorProto, GeneratorProto, PromiseProto
    const EmptyProto = {}

    try {
      AsyncGeneratorProto = (async function*() {})().__proto__.__proto__
    } catch(error) {
      AsyncGeneratorProto = EmptyProto
    }
    try {
      GeneratorProto = (function*() {})().__proto__.__proto__
    } catch(error) {
      GeneratorProto = EmptyProto
    }
    try {
      PromiseProto = (async function() {})().__proto__
    } catch(error) {
      PromiseProto = EmptyProto
    }

    const filterAsyncResult = result => {
      if (result == null || result.__proto__ == null) return

      if (result.__proto__ === PromiseProto) {
        throw new Error(
          'A Projection function cannot be asynchronous or return a Promise object'
        )
      }

      const innerProto = result.__proto__.__proto__
      if (innerProto == null) return

      if (innerProto === GeneratorProto || innerProto === AsyncGeneratorProto) {
        throw new Error(
          'A Projection function cannot be a generator or return an iterable object'
        )
      }
    }

    const wrapCheckProjection = projection => Object.keys(projection).reduce((acc, key) => {
      const originalHandler = projection[key].bind(projection)

      acc[key] = (...args) => {
        const result = originalHandler(...args)
        filterAsyncResult(result)
        return result
      }

      return acc
    }, {})`
  ]

  const exports = [`const viewModels = []`, ``]

  for (let index = 0; index < resolveConfig.viewModels.length; index++) {
    const viewModel = resolveConfig.viewModels[index]

    if (checkRuntimeEnv(viewModel.name)) {
      throw new Error(`${message.clientEnvError}.viewModels[${index}].name`)
    }
    const name = viewModel.name

    if (checkRuntimeEnv(viewModel.projection)) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].projection`
      )
    }
    const projection = resolveFile(viewModel.projection)

    const hmac = crypto.createHmac(
      'sha512',
      'resolve-view-model-projection-hash'
    )
    hmac.update(fs.readFileSync(projection).toString())
    const invariantHash = hmac.digest('hex')

    if (checkRuntimeEnv(viewModel.serializeState)) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].serializeState`
      )
    }
    const serializeState = resolveFile(
      viewModel.serializeState,
      'view_model_serialize_state.js'
    )

    if (checkRuntimeEnv(viewModel.deserializeState)) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].deserializeState`
      )
    }
    const deserializeState = resolveFile(
      viewModel.deserializeState,
      'view_model_deserialize_state.js'
    )

    if (checkRuntimeEnv(viewModel.validator)) {
      throw new Error(
        `${message.clientEnvError}.viewModels[${index}].validator`
      )
    }
    const validator = resolveFile(
      viewModel.validator,
      'view_model_validator.js'
    )

    const snapshotAdapter = viewModel.snapshotAdapter
      ? {
          module: checkRuntimeEnv(viewModel.snapshotAdapter.module)
            ? viewModel.snapshotAdapter.module
            : resolveFileOrModule(viewModel.snapshotAdapter.module),
          options: {
            ...viewModel.snapshotAdapter.options
          }
        }
      : {}

    imports.push(
      `import projection_${index} from ${JSON.stringify(projection)}`
    )

    constants.push(
      `const invariantHash_${index} = ${JSON.stringify(invariantHash)}`
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
      if (checkRuntimeEnv(viewModel.snapshotAdapter.module)) {
        constants.push(
          `const snapshotAdapter_${index} = ${injectRuntimeEnv(
            snapshotAdapter
          )}`,
          `const snapshotAdapterModule_${index} = interopRequireDefault(`,
          `  __non_webpack_require__(snapshotAdapter_${index}.module)`,
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
          `const snapshotAdapterOptions_${index} = ${JSON.stringify(
            snapshotAdapter.options
          )}`
        )
      }
    }

    exports.push(
      `viewModels.push({`,
      `  name: name_${index}`,
      `, projection: wrapCheckProjection(projection_${index})`,
      `, invariantHash: invariantHash_${index}`
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
