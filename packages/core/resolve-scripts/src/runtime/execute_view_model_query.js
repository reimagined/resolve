import viewModelQueryExecutors from './view_model_query_executors'

const executeViewModelQuery = async ({ modelName, aggregateIds }) => {
  if (!viewModelQueryExecutors.hasOwnProperty(modelName)) {
    throw new Error(`View model ${modelName} does not exist`)
  }

  return await viewModelQueryExecutors[modelName].read({ aggregateIds })
}

export default executeViewModelQuery
