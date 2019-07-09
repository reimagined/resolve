export default async (req, res) => {
  const { listenerId, key, value } = req.query
  await req.resolve.eventBroker.setProperty(listenerId, key, value)
  res.end(`ListenerId = "${listenerId}", Key = "${key}", Value = "${value}"`)
}
