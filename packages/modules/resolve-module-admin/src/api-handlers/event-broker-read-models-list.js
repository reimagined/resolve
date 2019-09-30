const readModelList = async (req, res) => {
  const listenerIds = req.resolve.readModels
    .map(({ name }) => name)
    .filter(name => !req.resolve.sagaNames.has(name))
  const statuses = await Promise.all(
    listenerIds.map(req.resolve.eventBroker.status)
  )
  res.json(statuses)
}

export default readModelList
