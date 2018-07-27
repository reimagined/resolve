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
    const name = aggregate.name
    const commands = resolveFile(aggregate.commands)

    const projection = aggregate.projection
      ? resolveFile(aggregate.projection)
      : undefined

    const snapshotAdapter = aggregate.snapshotAdapter
      ? {
          module: resolveFileOrModule(aggregate.snapshotAdapter.module),
          options: {
            ...aggregate.snapshotAdapter.options
          }
        }
      : {}

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

    if (!isClient && aggregate.snapshotAdapter) {
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

    exports.push(`aggregates.push({`)
    exports.push(`  name: name_${index}`)
    exports.push(`, commands: commands_${index}`)
    if (!isClient && aggregate.projection) {
      exports.push(`, projection: projection_${index}`)
    }
    if (!isClient && aggregate.snapshotAdapter) {
      exports.push(
        `, snapshotAdapter: {`,
        `    module: snapshotAdapterModule_${index},`,
        `    options: snapshotAdapterOptions_${index}`,
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
