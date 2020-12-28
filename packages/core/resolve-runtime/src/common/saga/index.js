import createCommand from 'resolve-command'
import createQuery from '../query/index'

//import createSchedulerSagas from './create-scheduler-sagas'
import wrapRegularSagas from './wrap-regular-sagas'

const createSaga = ({
  invokeEventBusAsync,
  onCommandExecuted,
  readModelConnectors,
  sagas,
  executeCommand,
  executeQuery,
  performanceTracer,
  uploader,
  eventstoreAdapter,
  getVacantTimeInMillis,
  performAcknowledge,
  scheduler,
  monitoring,
  domainInterop: { sagaDomain },
}) => {
  let eventProperties = {}

  const sagaMonitoring =
    monitoring != null
      ? {
          error: async (error, part, meta) => {
            if (monitoring.error != null) {
              await monitoring.error(error, 'sagaProjection', meta)
            }
          },
        }
      : monitoring

  const executeScheduleCommand = createCommand({
    aggregates: [sagaDomain.createSchedulerAggregate()],
    onCommandExecuted,
    eventstoreAdapter,
    monitoring,
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
    if (aggregateName === sagaDomain.schedulerName) {
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

  const regularSagas = wrapRegularSagas({
    sagas,
    schedulerName: sagaDomain.schedulerName,
    sagaProvider,
  })

  const schedulerSagas = sagaDomain.createSchedulersSagas({
    eventProperties: sagaProvider.eventProperties,
    executeCommand: sagaProvider.executeCommand,
    executeQuery: sagaProvider.executeQuery,
    getSecretsManager: sagaProvider.getSecretsManager,
    uploader: sagaProvider.uploader,
    scheduler,
  })

  const sagasAsReadModels = [...regularSagas, ...schedulerSagas].map(
    (saga) => ({
      provideLedger: async (inlineLedger) => {
        eventProperties = inlineLedger.Properties
      },
      ...saga,
    })
  )

  const executeListener = createQuery({
    invokeEventBusAsync,
    readModelConnectors,
    readModels: sagasAsReadModels,
    viewModels: [],
    performanceTracer,
    getVacantTimeInMillis,
    performAcknowledge,
    eventstoreAdapter,
    monitoring: sagaMonitoring,
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

  const dispose = async () =>
    await Promise.all([
      executeScheduleCommand.dispose(),
      executeListener.dispose(),
    ])

  const executeSaga = new Proxy(executeListener, {
    get(_, key) {
      if (key === 'sendEvents') {
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

export default createSaga
