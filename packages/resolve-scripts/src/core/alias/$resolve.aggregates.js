import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import importBabel from '../import_babel'

export default ({ resolveConfig, isClient }) => {
  const imports = []
  const constants = [``]
  const exports = [``, `const aggregates = []`, ``]

  for (let index = 0; index < resolveConfig.aggregates.length; index++) {
    const aggregate = resolveConfig.aggregates[index]

    const name = aggregate.name

    const commands = resolveFile(aggregate.commands)

    const projection = aggregate.projection
      ? resolveFile(aggregate.projection)
      : undefined

    const snapshotAdapter = aggregate.snapshot
      ? resolveFileOrModule(aggregate.snapshot.adapter)
      : undefined

    const snapshotOptions = aggregate.snapshot
      ? aggregate.snapshot.options
      : undefined

    if (!isClient) {
      imports.push(`import commands_${index} from "${commands}"`)
    }

    if (!isClient && aggregate.projection) {
      imports.push(`import projection_${index} from "${projection}"`)
    }

    if (!isClient && aggregate.snapshot) {
      imports.push(`import snapshotAdapter_${index} from "${snapshotAdapter}"`)
    }

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
        `const snapshotOptions_${index} = ${JSON.stringify(snapshotOptions)}`
      )
    }

    exports.push(`aggregates.push({`)
    exports.push(`  name: name_${index}`)
    exports.push(`, commands: commands_${index}`)
    if (!isClient && aggregate.projection) {
      exports.push(`, projection: ${JSON.stringify(projection)}`)
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
