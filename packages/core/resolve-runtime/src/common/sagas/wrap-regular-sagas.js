import debugLevels from 'resolve-debug-levels'
import uuid from 'uuid/v4'

import sagaEventHandler from './saga-event-handler'

const log = debugLevels('resolve:resolve-runtime:wrap-regular-sagas')

const scheduleCommand = async (
  currentReadModel,
  schedulerName,
  date,
  command
) => {
  const aggregateName = schedulerName
  const aggregateId = uuid()
  log.debug(
    `creating scheduled command aggregate ${aggregateName} with id ${aggregateId}`
  )
  return currentReadModel.executeCommand({
    aggregateName,
    aggregateId,
    type: 'create',
    payload: { date, command }
  })
}

const wrapRegularSagas = sagas => {
  const sagaReadModels = []

  for (const {
    name,
    source: { handlers, sideEffects },
    connectorName,
    schedulerName
  } of sagas) {
    const sagaReadModel = {
      name,
      resolvers: {},
      connectorName
    }
    const eventTypes = Object.keys(handlers)

    Object.defineProperty(sagaReadModel, 'projection', {
      get: function() {
        const currentReadModel = this
        const boundScheduleCommand = scheduleCommand.bind(
          null,
          currentReadModel,
          schedulerName
        )

        return eventTypes.reduce((acc, eventType) => {
          acc[eventType] = sagaEventHandler.bind(
            null,
            currentReadModel,
            handlers,
            sideEffects,
            eventType,
            boundScheduleCommand
          )
          return acc
        }, {})
      }
    })

    sagaReadModels.push(sagaReadModel)
  }

  return sagaReadModels
}

export default wrapRegularSagas
