import readModelQueryExecutors from './read_model_query_executors'

const statusHandler = async (req, res) => {
  for (const executeQuery of Object.values(readModelQueryExecutors)) {
    try {
      await executeQuery(executeQuery.resolverNames[0], {})
    } catch (e) {}
  }
  res.end('ok')
}

export default statusHandler
