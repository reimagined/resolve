const subscribeHandler = async (req, res) => {
  try {
    const parameters = req.method === 'POST' ? JSON.parse(req.body) : req.query
    const { origin, adapterName } = parameters
    await res.setHeader('Content-Type', 'application/json')
    await res.json(
      await req.resolve.getSubscribeAdapterOptions(origin, adapterName)
    )
  } catch (err) {
    resolveLog('warn', 'Subscribe handler error', err)
    await res.status(500)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(err.toString())
  }
}

export default subscribeHandler
