import createSchedulerEventTypes from './sagas/scheduler-event-types'
import wrapSagas from './sagas/wrap-sagas'

const prepareDomain = async resolve => {
  const [systemAggregates, customerAggregates] = resolve.aggregates.reduce(
    (acc, aggregate) => {
      const partition = aggregate.isSystemAggregate ? acc[0] : acc[1]
      partition.push(aggregate)
      return acc
    },
    [[], []]
  )

  for (const aggregate of systemAggregates) {
    const eventTypes = createSchedulerEventTypes({
      schedulerName: aggregate.schedulerName
    })
    const commandsCreator = aggregate.commands.bind(null, { eventTypes })
    const projectionCreator = aggregate.projection.bind(null, { eventTypes })
    aggregate.commands = commandsCreator()
    aggregate.projection = projectionCreator()
  }

  resolve.aggregates = [...systemAggregates, ...customerAggregates]

  const customerReadModels = resolve.readModels
  const systemReadModels = wrapSagas(resolve.sagas, resolve)

  resolve.readModels = [...customerReadModels, ...systemReadModels]

  resolve.systemReadModelsNames = systemReadModels.map(({ name }) => name)

  resolve.sagaNames = new Set(resolve.sagas.map(({ name }) => name))

  const notImplemented = async methodName => {
    throw new Error(
      `Fatal error: event broker method "${methodName}" is not implemented`
    )
  }

  resolve.eventBroker = {
    pause: notImplemented.bind(null, 'pause'),
    resume: notImplemented.bind(null, 'resume'),
    reset: notImplemented.bind(null, 'reset'),
    status: notImplemented.bind(null, 'status')
  }
}

export default prepareDomain
