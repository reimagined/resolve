import createCommand from 'resolve-command'
import createQuery from 'resolve-query'

import createSchedulerAggregate from './create-scheduler-aggregate'
import createSchedulerSagas from './create-scheduler-sagas'
import wrapRegularSagas from './wrap-regular-sagas'

const schedulerName = '_SCHEDULER_'
const schedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: `_RESOLVE_SYS_SCHEDULED_COMMAND_CREATED_`,
  SCHEDULED_COMMAND_EXECUTED: `_RESOLVE_SYS_SCHEDULED_COMMAND_EXECUTED_`,
  SCHEDULED_COMMAND_SUCCEEDED: `_RESOLVE_SYS_SCHEDULED_COMMAND_SUCCEEDED_`,
  SCHEDULED_COMMAND_FAILED: `_RESOLVE_SYS_SCHEDULED_COMMAND_FAILED_`,
}
const schedulerInvariantHash = 'scheduler-invariant-hash'

const createSaga = ({
  onError = async () => void 0,
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
}) => {
  const onSagaError = async (error) => {
    try {
      await onError(error, 'saga')
    } catch (e) {}
  }

  let eventProperties = {}

  const executeScheduleCommand = createCommand({
    aggregates: [
      createSchedulerAggregate({
        schedulerName,
        schedulerEventTypes,
        schedulerInvariantHash,
      }),
    ],
    onCommandExecuted,
    eventstoreAdapter,
    onError: onSagaError,
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
    if (aggregateName === schedulerName) {
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

  const regularSagas = wrapRegularSagas({ sagas, schedulerName, sagaProvider })
  const schedulerSagas = createSchedulerSagas({
    sagas,
    schedulerName,
    schedulerEventTypes,
    sagaProvider,
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
    onError: onSagaError,
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

export { schedulerName, schedulerEventTypes }

export default createSaga
