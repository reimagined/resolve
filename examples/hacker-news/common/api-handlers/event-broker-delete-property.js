export default async (req, res) => {
  const { listenerId, key } = req.query
  await req.resolve.eventBroker.deleteProperty(listenerId, key)
  res.end(`ListenerId = "${listenerId}", Key = "${key}" deleted`)
}
