import createCommand from 'resolve-command'
import createQuery from 'resolve-query'

import schedulerEventTypes from './scheduler-event-types'
import createSchedulersAggregates from './create-schedulers-aggregates'
import createSchedulerSagas from './create-scheduler-sagas'
import wrapRegularSagas from './wrap-regular-sagas'

const createSaga = ({
  eventStore,
  readModelConnectors,
  snapshotAdapter,
  sagas,
  schedulers,
  executeCommand,
  executeQuery,
  performanceTracer
}) => {
  const schedulerAggregatesNames = new Set(schedulers.map(({ name }) => name))
  let eventProperties = {}
  const executeScheduleCommand = createCommand({
    aggregates: createSchedulersAggregates(schedulers),
    eventStore,
    snapshotAdapter
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
    eventProperties: { get: () => eventProperties, enumerable: true }
  })

  const regularSagas = wrapRegularSagas(sagas, sagaProvider)
  const schedulerSagas = createSchedulerSagas(schedulers, sagaProvider)

  const executeListener = createQuery({
    eventStore,
    readModelConnectors,
    snapshotAdapter,
    readModels: [...regularSagas, ...schedulerSagas],
    viewModels: [],
    performanceTracer
  })

  const updateByEvents = async (
    sagaName,
    events,
    remainingTime,
    properties
  ) => {
    eventProperties = properties
    const result = await executeListener.updateByEvents(
      sagaName,
      events,
      remainingTime
    )
    return result
  }

  const dispose = async () =>
    await Promise.all([
      executeScheduleCommand.dispose(),
      executeListener.dispose()
    ])

  const executeSaga = Object.assign(
    executeListener.bind(executeListener),
    executeListener,
    { updateByEvents, dispose }
  )

  return executeSaga
}

export { schedulerEventTypes }

export default createSaga
