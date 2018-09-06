import queryExecutor from './query_executor'

const statusHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  for (const executor of queryExecutor.getExecutors()) {
    try {
      await executor.read({
        resolverName: executor.resolverNames[0],
        resolverArgs: {}
      })
    } catch (e) {}
  }
  res.end('ok')
}

export default statusHandler
