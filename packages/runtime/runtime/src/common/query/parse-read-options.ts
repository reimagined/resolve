const parseReadOptions = (options: any): Array<any> => {
  const optionsFlags: any = {
    modelOptions: 1 << 0,
    modelArgs: 1 << 1,
    resolverName: 1 << 2,
    resolverArgs: 1 << 3,
    aggregateIds: 1 << 4,
    aggregateArgs: 1 << 5,
  }

  const optionsMap = []
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

  return [options[optionsMap[flag][0]], options[optionsMap[flag][1]]]
}

export default parseReadOptions
