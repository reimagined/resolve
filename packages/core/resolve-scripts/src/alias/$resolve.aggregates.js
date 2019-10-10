import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_NOWHERE,
  IMPORT_INSTANCE
} from '../constants'
import importBabel from '../import_babel'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'
import resolveFileOrModule from '../resolve_file_or_module'
import resolveFile from '../resolve_file'

export default ({ resolveConfig, isClient }) => {
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
      imports: !isClient ? imports : [],
      constants: !isClient ? constants : []
    })

    if (isClient) {
      const clientCommands = Object.keys(
        aggregate.commands.constructor === String
          ? importBabel(resolveFile(aggregate.commands))
          : importBabel(resolveFileOrModule(aggregate.commands.module))(
              aggregate.commands.options,
              aggregate.commands.imports != null
                ? Object.keys(aggregate.commands.imports).reduce((acc, key) => {
                    acc[key] = importBabel(
                      resolveFile(aggregate.commands.imports[key])
                    )
                    return acc
                  }, {})
                : null
            )
      )

      constants.push(
        `const commands_${index} = {`,
        clientCommands
          .map(commandName => `  [\`${commandName}\`]: () => {}`)
          .join(',\r\n'),
        `}`
      )
    }

    exports.push(`aggregates.push({`)
    exports.push(`  name: name_${index}`)
    exports.push(`, commands: commands_${index}`)

    if (!isClient) {
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
    }

    exports.push(`})`, ``)
  }

  exports.push(`export default aggregates`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
