import getLog from './get-log'
import { v4 as uuid } from 'uuid'

import sagaEventHandler from './saga-event-handler'

const log = getLog('wrap-regular-sagas')

const scheduleCommand = async (sagaProvider, schedulerName, date, command) => {
  const aggregateId = uuid()
  log.debug(
    `creating scheduled command aggregate ${schedulerName} with id ${aggregateId}`
  )
  return sagaProvider.executeCommand({
    aggregateName: schedulerName,
    aggregateId,
    type: 'create',
    payload: { date, command },
  })
}

const wrapRegularSagas = ({ sagas, schedulerName, sagaProvider }) => {
  const sagaReadModels = []

  for (const {
    name,
    handlers,
    sideEffects,
    connectorName,
    encryption,
  } of sagas) {
    const boundScheduleCommand = scheduleCommand.bind(
      null,
      sagaProvider,
      schedulerName
    )

    const eventTypes = Object.keys(handlers)
    const projection = eventTypes.reduce((acc, eventType) => {
      acc[eventType] = sagaEventHandler.bind(
        null,
        sagaProvider,
        handlers,
        sideEffects,
        eventType,
        boundScheduleCommand
      )
      return acc
    }, {})

    const sagaReadModel = {
      name,
      projection,
      resolvers: {},
      connectorName,
      encryption,
    }

    sagaReadModels.push(sagaReadModel)
  }

  return sagaReadModels
}

export default wrapRegularSagas
