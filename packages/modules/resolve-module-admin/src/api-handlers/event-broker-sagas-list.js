const sagasList = async (req, res) => {
  const listenerIds = [
    ...req.resolve.schedulers.map(({ name }) => ({ eventSubscriber: name })),
    ...req.resolve.sagas.map(({ name }) => ({ eventSubscriber: name }))
  ]
  const statuses = await Promise.all(
    listenerIds.map(req.resolve.publisher.status)
  )
  res.json(statuses)
}

export default sagasList
