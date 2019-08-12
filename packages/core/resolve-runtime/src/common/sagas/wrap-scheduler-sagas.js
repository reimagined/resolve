import debugLevels from 'resolve-debug-levels'

import initResolve from '../init-resolve'
import disposeResolve from '../dispose-resolve'
import createSchedulerEventTypes from './scheduler-event-types'

import sagaEventHandler from './saga-event-handler'

const log = debugLevels('resolve:resolve-runtime:wrap-scheduler-sagas')

const execute = async (
  resolve,
  schedulerAggregateName,
  taskId,
  date,
  command
) => {
  const currentResolve = Object.create(resolve)
  try {
    await initResolve(currentResolve)
    return await currentResolve.executeCommand({
      aggregateName: schedulerAggregateName,
      aggregateId: taskId,
      type: 'execute',
      payload: { date, command }
    })
  } finally {
    await disposeResolve(currentResolve)
  }
}

const wrapSchedulerSagas = (sagas, resolve) => {
  const sagaReadModels = []

  for (const {
    name,
    source: handlersCreator,
    sideEffects: sideEffectsCreator,
    connectorName
  } of sagas) {
    const sagaReadModel = {
      name,
      resolvers: {},
      connectorName
    }

    const schedulerAggregateName = name
    const commandsTableName = name

    const handlers = handlersCreator({
      schedulerAggregateName,
      commandsTableName,
      eventTypes: createSchedulerEventTypes({ schedulerName: name })
    })
    const sideEffects = sideEffectsCreator({
      execute: execute.bind(null, resolve, schedulerAggregateName),
      errorHandler: async e => {
        log.error(`scheduler adapter failure: ${e.stack}`)
        throw e
      }
    })

    sagaReadModel['schedulerAdapter'] = sideEffects
    const eventTypes = Object.keys(handlers)

    Object.defineProperty(sagaReadModel, 'projection', {
      get: function() {
        const currentReadModel = this

        return eventTypes.reduce((acc, eventType) => {
          log.debug(
            `[wrap-sagas] registering system scheduler saga event handler ${eventType}`
          )
          acc[eventType] = sagaEventHandler.bind(
            null,
            currentReadModel,
            handlers,
            sideEffects,
            eventType,
            Function() // eslint-disable-line no-new-func
          )

          return acc
        }, {})
      }
    })

    sagaReadModels.push(sagaReadModel)
  }

  return sagaReadModels
}

export default wrapSchedulerSagas
