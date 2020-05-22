import createSchedulerEventTypes from './scheduler-event-types'
import createSchedulerAggregateCommands from './scheduler-aggregate-commands'
import createSchedulerAggregateProjection from './scheduler-aggregate-projection'

const createSchedulersAggregates = schedulers => {
  const aggregates = []
  for (const { name: schedulerName, invariantHash, encryption } of schedulers) {
    const eventTypes = createSchedulerEventTypes({ schedulerName })

    aggregates.push({
      name: schedulerName,
      commands: createSchedulerAggregateCommands({ eventTypes }),
      projection: createSchedulerAggregateProjection({ eventTypes }),
      invariantHash,
      encryption
    })
  }

  return aggregates
}

export default createSchedulersAggregates
