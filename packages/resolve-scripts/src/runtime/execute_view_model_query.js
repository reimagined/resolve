import viewModelQueryExecutors from './view_model_query_executors'

const executeViewModelQuery = async ({ modelName, aggregateIds }) => {
  return await viewModelQueryExecutors[modelName].read({ aggregateIds })
}

export default executeViewModelQuery
