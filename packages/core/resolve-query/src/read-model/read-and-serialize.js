const readAndSerialize = async (
  repository,
  { resolverName, resolverArgs, jwtToken }
) => {
  const result = await repository.read(repository, {
    resolverName,
    resolverArgs,
    jwtToken
  })

  return JSON.stringify(result, null, 2)
}

export default readAndSerialize
