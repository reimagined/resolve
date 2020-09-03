const resume = async (req, res) => {
  const { listenerId } = req.query
  try {
    await req.resolve.eventBus.resume({ eventSubscriber: listenerId })
    res.end(`ListenerId = "${listenerId}" running`)
  } catch (e) {
    res.end(`Listener "${listenerId}" does not exist`)
  }
}

export default resume
