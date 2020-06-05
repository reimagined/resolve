import createCommand from 'resolve-command'
import createQuery from 'resolve-query'

import schedulerEventTypes from './scheduler-event-types'
import createSchedulersAggregates from './create-schedulers-aggregates'
import createSchedulerSagas from './create-scheduler-sagas'
import wrapRegularSagas from './wrap-regular-sagas'

const createSaga = ({
  publisher,
  readModelConnectors,
  sagas,
  schedulers,
  executeCommand,
  executeQuery,
  performanceTracer,
  uploader,
  eventstoreAdapter
}) => {
  const schedulerAggregatesNames = new Set(schedulers.map(({ name }) => name))
  let eventProperties = {}
  const executeScheduleCommand = createCommand({
    aggregates: createSchedulersAggregates(schedulers),
    publisher,
    eventstoreAdapter
  })

  const executeCommandOrScheduler = async (...args) => {
    const aggregateName = args[0].aggregateName
    if (schedulerAggregatesNames.has(aggregateName)) {
      return await executeScheduleCommand(...args)
    } else {
      return await executeCommand(...args)
    }
  }

  const sagaProvider = Object.create(Object.prototype, {
    executeCommand: { get: () => executeCommandOrScheduler, enumerable: true },
    executeQuery: { get: () => executeQuery, enumerable: true },
    eventProperties: { get: () => eventProperties, enumerable: true },
    getSecretsManager: {
      get: () => eventstoreAdapter.getSecretsManager,
      enumerable: true
    },
    uploader: { get: () => uploader, enumerable: true }
  })

  const regularSagas = wrapRegularSagas(sagas, sagaProvider)
  const schedulerSagas = createSchedulerSagas(schedulers, sagaProvider)

  const executeListener = createQuery({
    publisher,
    readModelConnectors,
    readModels: [...regularSagas, ...schedulerSagas],
    viewModels: [],
    performanceTracer,
    eventstoreAdapter
  })

  const updateByEvents = async ({
    modelName,
    events,
    getRemainingTimeInMillis,
    xaTransactionId,
    properties
  }) => {
    eventProperties = properties
    const result = await executeListener.updateByEvents({
      modelName,
      events,
      getRemainingTimeInMillis,
      xaTransactionId
    })
    return result
  }

  const runScheduler = async entry => {
    const schedulerPromises = []
    for (const { schedulerAdapter } of schedulerSagas) {
      if (typeof schedulerAdapter.executeEntries === 'function') {
        schedulerPromises.push(schedulerAdapter.executeEntries(entry))
      }
    }

    return await Promise.all(schedulerPromises)
  }

  const dispose = async () =>
    await Promise.all([
      executeScheduleCommand.dispose(),
      executeListener.dispose()
    ])

  const executeSaga = Object.assign(
    executeListener.bind(executeListener),
    executeListener,
    { updateByEvents, runScheduler, dispose }
  )

  return executeSaga
}

export { schedulerEventTypes }

export default createSaga
