import resolveFile from '../resolve_file'
import resolveFileOrModule from '../resolve_file_or_module'
import importBabel from '../import_babel'

export default ({ resolveConfig, isClient }) => {
  const imports = []
  const consts = [``]
  const aggregates = [``, `const aggregates = []`, ``]

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

    consts.push(`const name_${index} = ${JSON.stringify(name)}`)

    if (isClient) {
      const clientCommands = Object.keys(importBabel(commands))

      consts.push(
        `const commands_${index} = {`,
        clientCommands
          .map(commandName => `  ${commandName}() {}`)
          .join(',\r\n'),
        `}`
      )
    }

    if (!isClient && aggregate.snapshot) {
      consts.push(
        `const snapshotOptions_${index} = ${JSON.stringify(snapshotOptions)}`
      )
    }

    aggregates.push(`aggregates.push({`)
    aggregates.push(`  name: name_${index}`)
    aggregates.push(`, commands: commands_${index}`)
    if (!isClient && aggregate.projection) {
      aggregates.push(`, projection: ${JSON.stringify(projection)}`)
    }
    if (!isClient && aggregate.snapshot) {
      aggregates.push(
        `, snapshot: {`,
        `    adapter: snapshotAdapter_${index},`,
        `    options: snapshotOptions_${index}`,
        `  }`
      )
    }
    aggregates.push(`})`, ``)
  }

  aggregates.push(`export default aggregates`)

  return {
    code: [...imports, ...consts, ...aggregates].join('\r\n')
  }
}
