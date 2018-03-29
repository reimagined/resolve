const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
  if (!aggregateId) throw new Error('The "aggregateId" argument is required')
  if (!aggregateName)
    throw new Error('The "aggregateName" argument is required')
  if (!type) throw new Error('The "type" argument is required')
}

const getAggregateState = async (
  { projection, initialState },
  aggregateId,
  eventStore
) => {
  const handlers = projection || {}
  let aggregateState = initialState
  let aggregateVersion = 0

  await eventStore.getEventsByAggregateId(aggregateId, event => {
    aggregateVersion = event.aggregateVersion
    const handler = handlers[event.type]
    if (!handler) return

    aggregateState = handler(aggregateState, event)
  })

  return { aggregateState, aggregateVersion }
}

const executeCommand = async (command, aggregate, eventStore, jwtToken) => {
  const { aggregateId, type } = command
  let { aggregateState, aggregateVersion } = await getAggregateState(
    aggregate,
    aggregateId,
    eventStore
  )

  const handler = aggregate.commands[type]
  const event = handler(aggregateState, command, jwtToken, aggregateVersion)

  if (!event.type) {
    throw new Error('event type is required')
  }

  event.aggregateId = aggregateId
  if (!event.aggregateVersion) {
    event.aggregateVersion = ++aggregateVersion
  }
  return event
}

function createExecutor({ eventStore, aggregate }) {
  return async (command, jwtToken) => {
    const event = await executeCommand(command, aggregate, eventStore, jwtToken)
    return await eventStore.saveEvent(event)
  }
}

export default ({ eventStore, aggregates }) => {
  const executors = aggregates.reduce((result, aggregate) => {
    result[aggregate.name.toLowerCase()] = createExecutor({
      eventStore,
      aggregate
    })
    return result
  }, {})

  return async (command, jwtToken) => {
    await verifyCommand(command)
    const aggregateName = command.aggregateName.toLowerCase()
    return executors[aggregateName](command, jwtToken)
  }
}
