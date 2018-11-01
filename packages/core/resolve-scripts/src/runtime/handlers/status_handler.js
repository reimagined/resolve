const statusHandler = async (req, res) => {
  if (req.method !== 'GET') {
    await res.status(405)
    await res.end('Invalid HTTP method for status invocation')
    return
  }

  const executeQuery = req.resolve.executeQuery
  for (const executor of executeQuery.getExecutors().values()) {
    try {
      await executor.read({
        resolverName: executor.resolverNames[0],
        resolverArgs: {}
      })
    } catch (e) {}
  }

  await res.end('ok')
}

export default statusHandler
