import createQuery from '../query/index'

const createSaga = ({
  invokeEventBusAsync,
  readModelConnectors,
  executeCommand,
  executeQuery,
  performanceTracer,
  uploader,
  eventstoreAdapter,
  secretsManager,
  getVacantTimeInMillis,
  performAcknowledge,
  scheduler,
  monitoring,
  domainInterop,
  executeSchedulerCommand,
}) => {
  let eventProperties = {}

  const { sagaDomain } = domainInterop

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
      return await executeSchedulerCommand(options)
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

  const runtime = Object.create(Object.prototype, {
    executeCommand: { get: () => executeCommandOrScheduler, enumerable: true },
    executeQuery: { get: () => executeDirectQuery, enumerable: true },
    eventProperties: { get: () => eventProperties, enumerable: true },
    secretsManager: { get: () => secretsManager, enumerable: true },
    uploader: { get: () => uploader, enumerable: true },
    scheduler: { get: () => scheduler, enumerable: true },
  })

  const provideLedger = async (inlineLedger) => {
    eventProperties = inlineLedger.Properties
  }

  const executeListener = createQuery({
    invokeEventBusAsync,
    readModelConnectors,
    performanceTracer,
    getVacantTimeInMillis,
    performAcknowledge,
    eventstoreAdapter,
    monitoring: sagaMonitoring,
    provideLedger,
    readModelsInterop: domainInterop.sagaDomain.acquireSagasInterop(runtime),
    viewModelsInterop: {},
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

  const dispose = async () => await Promise.all([executeListener.dispose()])

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
