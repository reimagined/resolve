const pause = async (req, res) => {
  const { listenerId } = req.query
  try {
    await req.resolve.eventBroker.pause(listenerId)
    res.end(`ListenerId = "${listenerId}" paused`)
  } catch (e) {
    res.end(`Listener "${listenerId}" does not exist`)
  }
}

export default pause
