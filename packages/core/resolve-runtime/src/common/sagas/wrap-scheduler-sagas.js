import {
  RESOLVE_SCHEDULER_SAGA_PREFIX,
  RESOLVE_SCHEDULER_TABLE_PREFIX,
  RESOLVE_SCHEDULER_AGGREGATE_PREFIX
} from './constants'
import initResolve from '../init-resolve'
import disposeResolve from '../dispose-resolve'
import createSchedulerEventTypes from './scheduler-event-types'

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
      name: `${RESOLVE_SCHEDULER_SAGA_PREFIX}${name}`,
      resolvers: {
        RUN_BROKER: async () => {}
      },
      connectorName
    }

    const schedulerAggregateName = `${RESOLVE_SCHEDULER_AGGREGATE_PREFIX}${name}`
    const commandsTableName = `${RESOLVE_SCHEDULER_TABLE_PREFIX}${name}`

    const handlers = handlersCreator({
      schedulerAggregateName,
      commandsTableName,
      eventTypes: createSchedulerEventTypes({ schedulerName: name })
    })
    const sideEffects = sideEffectsCreator({
      execute: execute.bind(null, resolve, schedulerAggregateName),
      errorHandler: async e => {
        resolveLog('error', `scheduler adapter failure: ${e.stack}`)
        throw e
      }
    })

    sagaReadModel['schedulerAdapter'] = sideEffects

    const eventTypes = Object.keys(handlers)

    const wrappedSideEffects = Object.keys(sideEffects).reduce((acc, key) => {
      acc[key] = async (...args) => {
        const result = await sideEffects[key](...args)
        if (result !== undefined) {
          throw new Error('Side effect should not return any values')
        }
      }
      return acc
    }, {})

    Object.defineProperty(sagaReadModel, 'projection', {
      get: function() {
        const currentReadModel = this
        return eventTypes.reduce((acc, eventType) => {
          resolveLog(
            'debug',
            `[wrap-sagas] registering system scheduler saga event handler ${eventType}`
          )
          acc[eventType] = async (store, event) => {
            await handlers[eventType](
              {
                scheduleCommand: null,
                sideEffects: wrappedSideEffects,
                executeCommand: currentReadModel.executeCommand,
                executeQuery: currentReadModel.executeQuery,
                store: store
              },
              event
            )
          }

          return acc
        }, {})
      }
    })

    sagaReadModels.push(sagaReadModel)
  }

  return sagaReadModels
}

export default wrapSchedulerSagas
