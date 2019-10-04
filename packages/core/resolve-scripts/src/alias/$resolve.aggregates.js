import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_NOWHERE,
  IMPORT_INSTANCE,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.readModels`
    )
  }

  const imports = []
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
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants
    })

    exports.push(`aggregates.push({`)
    exports.push(`  name: name_${index}`)
    exports.push(`, commands: commands_${index}`)

    importResource({
      resourceName: `serializeState_${index}`,
      resourceValue: aggregate.serializeState,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback:
        'resolve-runtime/lib/common/defaults/json-serialize-state.js',
      imports,
      constants
    })

    exports.push(`, serializeState: serializeState_${index}`)

    importResource({
      resourceName: `deserializeState_${index}`,
      resourceValue: aggregate.deserializeState,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback:
        'resolve-runtime/lib/common/defaults/json-deserialize-state.js',
      imports,
      constants
    })

    exports.push(`, deserializeState: deserializeState_${index}`)

    if (aggregate.projection != null) {
      importResource({
        resourceName: `projection_${index}`,
        resourceValue: aggregate.projection,
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        calculateHash: 'resolve-aggregate-projection-hash',
        imports,
        constants
      })

      exports.push(`, projection: projection_${index}`)
      exports.push(`, invariantHash: projection_${index}_hash`)
    }

    exports.push(`})`, ``)
  }

  const schedulersNames = Object.keys(resolveConfig.schedulers)

  for (let index = 0; index < schedulersNames.length; index++) {
    constants.push(
      `const name_s_${index} = ${JSON.stringify(`${schedulersNames[index]}`)}`
    )

    importResource({
      resourceName: `commands_s_${index}`,
      resourceValue: {
        module:
          'resolve-runtime/lib/common/sagas/scheduler-aggregate-commands.js',
        options: {}
      },
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants
    })

    importResource({
      resourceName: `projection_s_${index}`,
      resourceValue: {
        module:
          'resolve-runtime/lib/common/sagas/scheduler-aggregate-projection.js',
        options: {}
      },
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants
    })

    importResource({
      resourceName: `serializeState_s_${index}`,
      resourceValue: ':',
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback:
        'resolve-runtime/lib/common/defaults/json-serialize-state.js',
      imports,
      constants
    })

    importResource({
      resourceName: `deserializeState_s_${index}`,
      resourceValue: ':',
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback:
        'resolve-runtime/lib/common/defaults/json-deserialize-state.js',
      imports,
      constants
    })

    exports.push(`aggregates.push({`, `  name: name_s_${index}`)
    exports.push(`, commands: commands_s_${index}`)
    exports.push(`, projection: projection_s_${index}`)
    exports.push(`, serializeState: serializeState_s_${index}`)
    exports.push(`, deserializeState: deserializeState_s_${index}`)
    exports.push(`, invariantHash: ${JSON.stringify(`${Date.now()}`)}`)
    exports.push(`, schedulerName: ${JSON.stringify(schedulersNames[index])}`)
    exports.push(`, isSystemAggregate: true`)
    exports.push(`})`, ``)
  }

  exports.push(`export default aggregates`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
