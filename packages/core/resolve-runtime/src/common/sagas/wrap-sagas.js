import uuid from 'uuid/v4'

import createSchedulerEventTypes from './scheduler-event-types'
import initResolve from '../init-resolve'
import disposeResolve from '../dispose-resolve'

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

const wrapSagas = (sagas, resolve) => {
  const sagaReadModels = []

  for (const {
    name,
    source: handlersCreator,
    sideEffects: sideEffectsCreator,
    connectorName,
    isSystemScheduler
  } of sagas) {
    if (!isSystemScheduler) continue
    const sagaReadModel = {
      name: `_RESOLVE_SCHEDULER_SAGA_${name}`,
      resolvers: {
        RUN_BROKER: async () => {}
      },
      connectorName
    }

    const schedulerAggregateName = `_RESOLVE_SCHEDULER_AGGREGATE_${name}`
    const commandsTableName = `_RESOLVE_SCHEDULER_AGGREGATE_TABLE_${name}`

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

  //////

  for (const {
    name,
    source: { handlers, sideEffects },
    connectorName,
    schedulerName,
    isSystemScheduler
  } of sagas) {
    if (isSystemScheduler) continue
    const sagaReadModel = {
      name: `_RESOLVE_SAGA_${name}`,
      isSaga: true,
      resolvers: {
        RUN_BROKER: async () => {}
      },
      connectorName
    }

    const eventTypes = Object.keys(handlers)

    let doSideEffects = true
    const wrappedSideEffects = Object.keys(sideEffects).reduce((acc, key) => {
      acc[key] = async (...args) => {
        if (!doSideEffects) return
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
          acc[eventType] = async (store, event) => {
            doSideEffects = true // TODO Extract from store

            await handlers[eventType](
              {
                scheduleCommand: async (date, command) => {
                  const aggregateName = `_RESOLVE_SCHEDULER_AGGREGATE_${schedulerName}`
                  const aggregateId = uuid()
                  resolveLog(
                    'debug',
                    `creating scheduled command aggregate ${aggregateName} with id ${aggregateId}`
                  )
                  return currentReadModel.executeCommand({
                    aggregateName,
                    aggregateId,
                    type: 'create',
                    payload: { date, command }
                  })
                },
                sideEffects: wrappedSideEffects,
                executeCommand: currentReadModel.executeCommand,
                executeQuery: currentReadModel.executeQuery,
                store
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

export default wrapSagas
