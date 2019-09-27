export default async (req, res) => {
  const { listenerId } = req.query
  const listProperties = await req.resolve.eventBroker.listProperties(
    listenerId
  )
  res.json(listProperties)
}
