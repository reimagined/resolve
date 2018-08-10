import readModelQueryExecutors from './read_model_query_executors'

const executeReadModelQuery = async ({
  jwtToken,
  modelName,
  resolverName,
  resolverArgs
}) => {
  if (!readModelQueryExecutors.hasOwnProperty(modelName)) {
    throw new Error(`Read model ${modelName} does not exist`)
  }

  return await readModelQueryExecutors[modelName].read(resolverName, {
    ...resolverArgs,
    jwtToken
  })
}

export default executeReadModelQuery
