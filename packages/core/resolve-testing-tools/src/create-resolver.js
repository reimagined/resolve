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

  return result
}

export default createResolver
