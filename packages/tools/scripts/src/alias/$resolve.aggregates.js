import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_NOWHERE,
  RUNTIME_ENV_OPTIONS_ONLY,
  IMPORT_INSTANCE,
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

const importAggregate = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.aggregates`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = []
  const exports = [``, `const aggregates = []`, ``]

  for (let index = 0; index < resolveConfig.aggregates.length; index++) {
    const aggregate = resolveConfig.aggregates[index]

    if (checkRuntimeEnv(aggregate.name)) {
      throw new Error(`${message.clientEnvError}.aggregates[${index}].name`)
    }
    constants.push(`const name_${index} = ${JSON.stringify(aggregate.name)}`)

    importResource({
      resourceName: `commands_${index}`,
      resourceValue: aggregate.commands,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants,
    })

    exports.push(`aggregates.push({`)
    exports.push(`  name: name_${index}`)
    exports.push(`, commands: commands_${index}`)

    importResource({
      resourceName: `serializeState_${index}`,
      resourceValue: aggregate.serializeState,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback:
        '@resolve-js/runtime/lib/common/defaults/json-serialize-state.js',
      imports,
      constants,
    })

    exports.push(`, serializeState: serializeState_${index}`)

    importResource({
      resourceName: `deserializeState_${index}`,
      resourceValue: aggregate.deserializeState,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback:
        '@resolve-js/runtime/lib/common/defaults/json-deserialize-state.js',
      imports,
      constants,
    })

    exports.push(`, deserializeState: deserializeState_${index}`)

    if (aggregate.projection != null) {
      importResource({
        resourceName: `projection_${index}`,
        resourceValue: aggregate.projection,
        runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        calculateHash: 'resolve-aggregate-projection-hash',
        imports,
        constants,
      })

      exports.push(`, projection: projection_${index}`)
      exports.push(`, invariantHash: projection_${index}_hash`)
    }

    importResource({
      resourceName: `encryption_${index}`,
      resourceValue: aggregate.encryption,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback: '@resolve-js/runtime/lib/common/defaults/encryption.js',
      imports,
      constants,
    })

    exports.push(`, encryption: encryption_${index}`)
    exports.push(
      `, commandHttpResponseMode: '${
        aggregate.commandHttpResponseMode ?? 'event'
      }'`
    )

    exports.push(`})`, ``)
  }

  exports.push(`export default aggregates`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importAggregate
