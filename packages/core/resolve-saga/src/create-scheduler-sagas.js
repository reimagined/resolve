import debugLevels from 'resolve-debug-levels'

import createSchedulerEventTypes from './scheduler-event-types'
import createSchedulerSagaHandlers from './scheduler-saga-handlers'
import sagaEventHandler from './saga-event-handler'

const log = debugLevels('resolve:resolve-runtime:wrap-scheduler-sagas')

const execute = async (
  sagaProvider,
  schedulerAggregateName,
  taskId,
  date,
  command
) =>
  await sagaProvider.executeCommand({
    aggregateName: schedulerAggregateName,
    aggregateId: taskId,
    type: 'execute',
    payload: { date, command }
  })

const createSchedulerSagas = (schedulers, sagaProvider) => {
  const sagaReadModels = []

  for (const {
    name,
    connectorName,
    adapter: createSideEffectsAdapter
  } of schedulers) {
    const schedulerAggregateName = name
    const commandsTableName = name

    const handlers = createSchedulerSagaHandlers({
      schedulerAggregateName,
      commandsTableName,
      eventTypes: createSchedulerEventTypes({ schedulerName: name })
    })

    const sideEffects = createSideEffectsAdapter({
      execute: execute.bind(null, sagaProvider, schedulerAggregateName),
      errorHandler: async e => {
        log.error(`scheduler adapter failure: ${e.stack}`)
        throw e
      }
    })

    const eventTypes = Object.keys(handlers)
    const projection = eventTypes.reduce((acc, eventType) => {
      log.debug(
        `[wrap-sagas] registering system scheduler saga event handler ${eventType}`
      )
      acc[eventType] = sagaEventHandler.bind(
        null,
        sagaProvider,
        handlers,
        sideEffects,
        eventType,
        Function() // eslint-disable-line no-new-func
      )

      return acc
    }, {})

    const sagaReadModel = {
      name,
      projection,
      resolvers: {},
      connectorName,
      schedulerAdapter: sideEffects
    }

    sagaReadModels.push(sagaReadModel)
  }

  return sagaReadModels
}

export default createSchedulerSagas
