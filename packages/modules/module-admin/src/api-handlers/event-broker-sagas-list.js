import wrapApiHandler from './wrap-api-handler'

const sagasList = async (req, res) => {
  const statusPromises = []
  for (const name of [
    ...req.resolve.sagas.map((saga) => saga.name),
    ...req.resolve.domainInterop.sagaDomain.getSchedulersNamesBySagas(),
  ]) {
    statusPromises.push(
      req.resolve.eventSubscriber.status({ eventSubscriber: `${name}` })
    )
  }
  const statuses = await Promise.all(statusPromises)

  await res.json(statuses)
}

export default wrapApiHandler(sagasList)
