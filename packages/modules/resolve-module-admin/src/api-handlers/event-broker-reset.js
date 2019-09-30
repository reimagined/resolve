const reset = async (req, res) => {
  const { listenerId } = req.query
  await req.resolve.eventBroker.reset(listenerId)
  res.end(`ListenerId = "${listenerId}" reset`)
}

export default reset
