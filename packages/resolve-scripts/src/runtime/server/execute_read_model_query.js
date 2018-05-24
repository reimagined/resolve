import readModelQueryExecutors from './read_model_query_executors';

const executeReadModelQuery = async ({
  jwtToken,
  modelName,
  resolverName,
  resolverArgs
}) => {
  return await readModelQueryExecutors[modelName].read(resolverName, {
    ...resolverArgs,
    jwtToken
  });
};

export default executeReadModelQuery;
