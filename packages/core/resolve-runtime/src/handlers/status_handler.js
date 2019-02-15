const statusHandler = async (req, res) => {
  const executeQuery = req.resolve.executeQuery
  for (const executor of executeQuery.getExecutors().values()) {
    try {
      await executor.read({ isBulkRead: true })
    } catch (e) {}
  }

  await res.end('ok')
}

export default statusHandler
