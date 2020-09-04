import createCommand from 'resolve-command'
import createQuery from 'resolve-query'

import schedulerEventTypes from './scheduler-event-types'
import createSchedulersAggregates from './create-schedulers-aggregates'
import createSchedulerSagas from './create-scheduler-sagas'
import wrapRegularSagas from './wrap-regular-sagas'

const createSaga = ({
  invokeEventBusAsync,
  onCommandExecuted,
  readModelConnectors,
  sagas,
  schedulers,
  executeCommand,
  executeQuery,
  performanceTracer,
  uploader,
  eventstoreAdapter,
  getRemainingTimeInMillis,
  performAcknowledge,
}) => {
  const schedulerAggregatesNames = new Set(schedulers.map(({ name }) => name))
  let eventProperties = {}
  const executeScheduleCommand = createCommand({
    aggregates: createSchedulersAggregates(schedulers),
    onCommandExecuted,
    eventstoreAdapter,
  })

  const executeCommandOrScheduler = async (...args) => {
    if (
      !(
        args.length > 0 &&
        args.length < 3 &&
        Object(args[0]) === args[0] &&
        (Object(args[1]) === args[1] || args[1] == null)
      )
    ) {
      throw new Error(
        `Invalid saga command/scheduler args ${JSON.stringify(args)}`
      )
    }
    const options = { ...args[0] }

    const aggregateName = options.aggregateName
    if (schedulerAggregatesNames.has(aggregateName)) {
      return await executeScheduleCommand(options)
    } else {
      return await executeCommand(options)
    }
  }

  const executeDirectQuery = async (...args) => {
    if (
      !(
        args.length > 0 &&
        args.length < 3 &&
        Object(args[0]) === args[0] &&
        (Object(args[1]) === args[1] || args[1] == null)
      )
    ) {
      throw new Error(`Invalid saga query args ${JSON.stringify(args)}`)
    }

    const options = { ...args[0], properties: args[1] }
    return await executeQuery(options)
  }

  const sagaProvider = Object.create(Object.prototype, {
    executeCommand: { get: () => executeCommandOrScheduler, enumerable: true },
    executeQuery: { get: () => executeDirectQuery, enumerable: true },
    eventProperties: { get: () => eventProperties, enumerable: true },
    getSecretsManager: {
      get: () => eventstoreAdapter.getSecretsManager,
      enumerable: true,
    },
    uploader: { get: () => uploader, enumerable: true },
  })

  const regularSagas = wrapRegularSagas(sagas, sagaProvider)
  const schedulerSagas = createSchedulerSagas(schedulers, sagaProvider)

  const executeListener = createQuery({
    invokeEventBusAsync,
    readModelConnectors,
    readModels: [...regularSagas, ...schedulerSagas],
    viewModels: [],
    performanceTracer,
    getRemainingTimeInMillis,
    performAcknowledge,
    eventstoreAdapter,
  })

  const sendEvents = async ({
    modelName,
    events,
    xaTransactionId,
    properties,
    batchId,
  }) => {
    eventProperties = properties
    await executeListener.sendEvents({
      modelName,
      events,
      xaTransactionId,
      properties,
      batchId,
    })
  }

  const runScheduler = async (entry) => {
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
      executeListener.dispose(),
    ])

  const executeSaga = new Proxy(executeListener, {
    get(_, key) {
      if (key === 'runScheduler') {
        return runScheduler
      } else if (key === 'sendEvents') {
        return sendEvents
      } else if (key === 'dispose') {
        return dispose
      } else {
        return executeListener[key].bind(executeListener)
      }
    },
    set() {
      throw new TypeError(`Resolve-saga API is immutable`)
    },
  })

  return executeSaga
}

export { schedulerEventTypes }

export default createSaga
