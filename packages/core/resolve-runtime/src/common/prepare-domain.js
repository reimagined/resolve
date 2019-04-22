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

  resolve.bootstrapSymbol = Symbol('BOOTSTRAP')

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

  for (const readModel of resolve.readModels) {
    Object.defineProperty(readModel.resolvers, resolve.bootstrapSymbol, {
      value: async () => {}
    })
  }
}

export default prepareDomain
