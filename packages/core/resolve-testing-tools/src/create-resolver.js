const createResolver = ({ modelName, query }, resolverName) => async (
  resolverArgs,
  jwtToken
) => {
  const result = await query.read({
    modelName,
    resolverName,
    resolverArgs,
    jwtToken
  })

  const error = await query.getLastError({ modelName })
  if (error != null) {
    throw error
  }

  return result
}

export default createResolver
