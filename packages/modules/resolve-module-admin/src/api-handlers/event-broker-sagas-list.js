const sagasList = async (req, res) => {
  const listenerIds = [
    ...req.resolve.schedulers.map(({ name }) => name),
    ...req.resolve.sagas.map(({ name }) => name)
  ]
  const statuses = await Promise.all(
    listenerIds.map(req.resolve.eventBroker.status)
  )
  res.json(statuses)
}

export default sagasList
