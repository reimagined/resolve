const createResolvers = pool => {
  const resolvers = {}
  for (const resolverName of Object.keys(pool.resolvers)) {
    resolvers[resolverName] = pool.createResolver(pool, resolverName)
  }
  return Object.freeze(resolvers)
}

export default createResolvers
