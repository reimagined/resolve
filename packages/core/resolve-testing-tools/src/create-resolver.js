const createResolver = ({ modelName, query }, resolverName) => async (
  ...resolverArgs
) => {
  const result = await query.read({
    modelName,
    resolverName,
    resolverArgs
  })

  const error = await query.getLastError({ modelName })
  if (error != null) {
    throw error
  }

  return result
}

export default createResolver
