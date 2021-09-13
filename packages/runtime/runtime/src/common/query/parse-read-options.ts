const parseReadOptions = (options: any): [any, any] => {
  const optionsFlags: Record<string, number> = {
    modelOptions: 1 << 0,
    modelArgs: 1 << 1,
    resolverName: 1 << 2,
    resolverArgs: 1 << 3,
    aggregateIds: 1 << 4,
    aggregateArgs: 1 << 5,
  }

  const optionsMap: Record<number, Readonly<[string, string]>> = {}
  optionsMap[optionsFlags.modelOptions] = optionsMap[
    optionsFlags.modelOptions + optionsFlags.modelArgs
  ] = ['modelOptions', 'modelArgs']
  optionsMap[optionsFlags.resolverName] = optionsMap[
    optionsFlags.resolverName + optionsFlags.resolverArgs
  ] = ['resolverName', 'resolverArgs']
  optionsMap[optionsFlags.aggregateIds] = optionsMap[
    optionsFlags.aggregateIds + optionsFlags.aggregateArgs
  ] = ['aggregateIds', 'aggregateArgs']

  let flag = 0
  for (const key of Object.keys(options)) {
    flag += ~~optionsFlags[key]
  }

  if (optionsMap[flag] == null) {
    throw new Error('Wrong options for read invocation')
  }

  const optionNamesPair = optionsMap[flag]
  return [options[optionNamesPair[0]], options[optionNamesPair[1]]]
}

export default parseReadOptions
