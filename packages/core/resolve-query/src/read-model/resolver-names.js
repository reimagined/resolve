const resolverNames = repository => {
  if (repository.disposePromise) {
    throw new Error('Read model is disposed')
  }

  return Object.keys(repository.resolvers)
}

export default resolverNames
