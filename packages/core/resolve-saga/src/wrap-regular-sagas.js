import getLog from './get-log'
import uuid from 'uuid/v4'

import sagaEventHandler from './saga-event-handler'

const log = getLog('wrap-regular-sagas')

const scheduleCommand = async (sagaProvider, schedulerName, date, command) => {
  const aggregateName = schedulerName
  const aggregateId = uuid()
  log.debug(
    `creating scheduled command aggregate ${aggregateName} with id ${aggregateId}`
  )
  return sagaProvider.executeCommand({
    aggregateName,
    aggregateId,
    type: 'create',
    payload: { date, command }
  })
}

const wrapRegularSagas = (sagas, sagaProvider) => {
  const sagaReadModels = []

  for (const {
    name,
    handlers,
    sideEffects,
    connectorName,
    schedulerName,
    encryption
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
      encryption
    }

    sagaReadModels.push(sagaReadModel)
  }

  return sagaReadModels
}

export default wrapRegularSagas
