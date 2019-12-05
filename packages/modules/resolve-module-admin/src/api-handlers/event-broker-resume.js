const resume = async (req, res) => {
  const { listenerId } = req.query
  try {
    await req.resolve.eventBroker.resume(listenerId)
    res.end(`ListenerId = "${listenerId}" running`)
  } catch (e) {
    res.end(`Listener "${listenerId}" does not exist`)
  }
}

export default resume
