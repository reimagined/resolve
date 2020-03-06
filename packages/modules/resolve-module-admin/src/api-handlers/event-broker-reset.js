const reset = async (req, res) => {
  const { listenerId } = req.query
  try {
    await req.resolve.eventBroker.reset(listenerId)
    res.end(`ListenerId = "${listenerId}" reset`)
  } catch (e) {
    res.end(`Listener "${listenerId}" does not exist`)
  }
}

export default reset
