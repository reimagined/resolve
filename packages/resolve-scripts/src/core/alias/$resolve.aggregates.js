import { injectEnv, envKey } from 'json-env-extract'

import { message } from '../constants'
import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import importBabel from '../import_babel'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.aggregates) {
    throw new Error(`${message.configNotContainSectionError}.aggregates`)
  }

  const imports = [
    `import interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault"`,
    ``
  ]
  const constants = []
  const exports = [``, `const aggregates = []`, ``]

  for (let index = 0; index < resolveConfig.aggregates.length; index++) {
    const aggregate = resolveConfig.aggregates[index]

    if (aggregate.name in resolveConfig[envKey]) {
      throw new Error(`${message.clientEnvError}.aggregates[${index}].name`)
    }
    const name = aggregate.name

    if (aggregate.commands in resolveConfig[envKey]) {
      throw new Error(`${message.clientEnvError}.aggregates[${index}].commands`)
    }
    const commands = resolveFile(aggregate.commands)

    if (aggregate.projection && aggregate.projection in resolveConfig[envKey]) {
      throw new Error(
        `${message.clientEnvError}.aggregates[${index}].projection`
      )
    }
    const projection = aggregate.projection
      ? resolveFile(aggregate.projection)
      : undefined

    const snapshot = aggregate.snapshot
      ? {
          adapter:
            aggregate.snapshot.adapter in resolveConfig[envKey]
              ? aggregate.snapshot.adapter
              : resolveFileOrModule(aggregate.snapshot.adapter),
          options: {
            ...aggregate.snapshot.options
          }
        }
      : {}
    Object.defineProperty(snapshot, envKey, { value: resolveConfig[envKey] })

    if (!isClient) {
      imports.push(`import commands_${index} from ${JSON.stringify(commands)}`)
    }

    if (!isClient && aggregate.projection) {
      imports.push(
        `import projection_${index} from ${JSON.stringify(projection)}`
      )
    }

    imports.push(``)

    constants.push(`const name_${index} = ${JSON.stringify(name)}`)

    if (isClient) {
      const clientCommands = Object.keys(importBabel(commands))

      constants.push(
        `const commands_${index} = {`,
        clientCommands
          .map(commandName => `  ${commandName}() {}`)
          .join(',\r\n'),
        `}`
      )
    }

    if (!isClient && aggregate.snapshot) {
      constants.push(
        `const snapshot_${index} = ${injectEnv(snapshot)}`,
        `const snapshotAdapter_${index} = interopRequireDefault(`,
        `  require(snapshot_${index}.adapter)`,
        `).default`,
        `const snapshotOptions_${index} = snapshot_${index}.options`
      )
    }

    exports.push(`aggregates.push({`)
    exports.push(`  name: name_${index}`)
    exports.push(`, commands: commands_${index}`)
    if (!isClient && aggregate.projection) {
      exports.push(`, projection: projection_${index}`)
    }
    if (!isClient && aggregate.snapshot) {
      exports.push(
        `, snapshot: {`,
        `    adapter: snapshotAdapter_${index},`,
        `    options: snapshotOptions_${index}`,
        `  }`
      )
    }
    exports.push(`})`, ``)
  }

  exports.push(`export default aggregates`)

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
