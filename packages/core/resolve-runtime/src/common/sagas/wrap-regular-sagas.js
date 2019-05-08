import debugLevels from 'debug-levels'
import uuid from 'uuid/v4'
import {
  RESOLVE_SAGA_PREFIX,
  RESOLVE_SCHEDULER_AGGREGATE_PREFIX
} from './constants'

const log = debugLevels('resolve:resolve-runtime:wrap-regular-sagas')

const wrapRegularSagas = sagas => {
  const sagaReadModels = []

  for (const {
    name,
    source: { handlers, sideEffects },
    connectorName,
    schedulerName
  } of sagas) {
    const sagaReadModel = {
      name: `${RESOLVE_SAGA_PREFIX}${name}`,
      resolvers: {
        RUN_BROKER: async () => {}
      },
      connectorName
    }

    const eventTypes = Object.keys(handlers)

    let wrappedSideEffects = {}
    let doSideEffects = true

    if (sideEffects != null && sideEffects.constructor === Object) {
      wrappedSideEffects = Object.keys(sideEffects).reduce((acc, key) => {
        acc[key] = async (...args) => {
          if (!doSideEffects) return
          const result = await sideEffects[key](...args)
          if (result !== undefined) {
            throw new Error('Side effect should not return any values')
          }
        }
        return acc
      }, {})
    }

    Object.defineProperty(sagaReadModel, 'projection', {
      get: function() {
        const currentReadModel = this
        return eventTypes.reduce((acc, eventType) => {
          acc[eventType] = async (store, event) => {
            doSideEffects = true // TODO Extract from store

            await handlers[eventType](
              {
                scheduleCommand: async (date, command) => {
                  const aggregateName = `${RESOLVE_SCHEDULER_AGGREGATE_PREFIX}${schedulerName}`
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
                },
                properties: currentReadModel.eventProperties,
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

export default wrapRegularSagas
