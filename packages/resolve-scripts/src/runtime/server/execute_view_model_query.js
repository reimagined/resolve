import viewModelQueryExecutors from './view_model_query_executors'

const executeViewModelQuery = async ({ jwtToken, modelName, aggregateIds }) => {
  const state = await viewModelQueryExecutors[modelName].read({ aggregateIds })
  return viewModelQueryExecutors[modelName].serializeState(state, jwtToken)
}

export default executeViewModelQuery
