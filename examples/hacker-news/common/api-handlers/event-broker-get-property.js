export default async (req, res) => {
  const { listenerId, key } = req.query
  const value = await req.resolve.eventBroker.getProperty(listenerId, key)
  res.end(`ListenerId = "${listenerId}", Key = "${key}", Value = "${value}"`)
}
