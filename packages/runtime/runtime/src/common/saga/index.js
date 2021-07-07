import createQuery from '../query/index'

const createSaga = ({
  invokeBuildAsync,
  eventSubscriberScope,
  readModelConnectors,
  executeCommand,
  executeQuery,
  performanceTracer,
  uploader,
  eventstoreAdapter,
  secretsManager,
  getVacantTimeInMillis,
  scheduler,
  monitoring,
  domainInterop,
  executeSchedulerCommand,
}) => {
  const { sagaDomain } = domainInterop

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

    const options = { ...args[0] }

    return await executeQuery(options)
  }

  let currentSagaName = null
  const runtime = Object.create(Object.prototype, {
    executeCommand: { get: () => executeCommandOrScheduler, enumerable: true },
    executeQuery: { get: () => executeDirectQuery, enumerable: true },
    secretsManager: { get: () => secretsManager, enumerable: true },
    uploader: { get: () => uploader, enumerable: true },
    scheduler: { get: () => scheduler, enumerable: true },
  })

  const executeSagaListener = createQuery({
    invokeBuildAsync,
    eventSubscriberScope,
    readModelConnectors,
    performanceTracer,
    getVacantTimeInMillis,
    eventstoreAdapter,
    monitoring,
    readModelsInterop: domainInterop.sagaDomain.acquireSagasInterop(runtime),
    viewModelsInterop: {},
  })

  const sideEffectPropertyName = 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'

  Object.defineProperties(runtime, {
    getSideEffectsTimestamp: {
      get: () => () =>
        executeSagaListener.getProperty({
          eventSubscriber: currentSagaName,
          key: sideEffectPropertyName,
        }),
      enumerable: true,
    },
    setSideEffectsTimestamp: {
      get: () => (sideEffectTimestamp) =>
        executeSagaListener.setProperty({
          eventSubscriber: currentSagaName,
          key: sideEffectPropertyName,
          value: sideEffectTimestamp,
        }),
      enumerable: true,
    },
  })

  const buildSaga = async (...args) => {
    if (
      !(
        args.length > 0 &&
        args.length < 3 &&
        Object(args[0]) === args[0] &&
        (Object(args[1]) === args[1] || args[1] == null)
      )
    ) {
      throw new Error(`Invalid build saga args ${JSON.stringify(args)}`)
    }

    try {
      let { eventSubscriber, modelName, ...parameters } = args[0]
      if (eventSubscriber == null && modelName == null) {
        throw new Error(`Either "eventSubscriber" nor "modelName" is null`)
      } else if (modelName == null) {
        modelName = eventSubscriber
      }
      if (currentSagaName != null) {
        throw new Error('Concurrent saga interop')
      }
      currentSagaName = modelName

      return await executeSagaListener.build({ modelName, ...parameters })
    } finally {
      if (currentSagaName == null) {
        throw new Error('Concurrent saga interop')
      }
      currentSagaName = null
    }
  }

  const executeSaga = new Proxy(executeSagaListener, {
    get(_, key) {
      if (key === 'build') {
        return buildSaga
      } else {
        return executeSagaListener[key].bind(executeSagaListener)
      }
    },
    set() {
      throw new TypeError(`Resolve-saga API is immutable`)
    },
  })

  return executeSaga
}

export default createSaga
