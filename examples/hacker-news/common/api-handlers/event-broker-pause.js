export default async (req, res) => {
  const { listenerId } = req.query
  await req.resolve.eventBroker.pause(listenerId)
  res.end(`ListenerId = "${listenerId}" paused`)
}
