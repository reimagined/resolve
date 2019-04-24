export default async (req, res) => {
  const { listenerId } = req.query
  const status = await req.resolve.eventBroker.status(listenerId)
  res.json(status)
}
