export default async (req, res) => {
  const { listenerId } = req.query
  await req.resolve.eventBroker.resume(listenerId)
  res.end(`ListenerId = "${listenerId}" running`)
}
