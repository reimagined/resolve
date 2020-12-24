import { DomainSaga } from 'resolve-runtime-interop'
import wrapApiHandler from './wrap-api-handler'

const sagasList = async (req, res) => {
  const statusPromises = []
  for (const name of [
    ...req.resolve.sagas.map((saga) => saga.name),
    ...DomainSaga.getSchedulersNamesBySagas(req.resolve.sagas),
  ]) {
    statusPromises.push(
      req.resolve.eventBus.status({ eventSubscriber: `${name}` })
    )
  }
  const statuses = await Promise.all(statusPromises)

  await res.json(statuses)
}

export default wrapApiHandler(sagasList)
