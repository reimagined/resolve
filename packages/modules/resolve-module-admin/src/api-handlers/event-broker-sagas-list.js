// FIXME: replace with import from resolve-runtime-interop
import { getSchedulersNamesBySagas } from 'resolve-saga'

import wrapApiHandler from './wrap-api-handler'

const sagasList = async (req, res) => {
  const statusPromises = []
  for (const name of [
    ...req.resolve.sagas.map((saga) => saga.name),
    ...getSchedulersNamesBySagas(req.resolve.sagas),
  ]) {
    statusPromises.push(
      req.resolve.eventBus.status({ eventSubscriber: `${name}` })
    )
  }
  const statuses = await Promise.all(statusPromises)

  await res.json(statuses)
}

export default wrapApiHandler(sagasList)
