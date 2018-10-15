const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
  if (!aggregateId) throw new Error('The "aggregateId" argument is required')
  if (aggregateId.constructor !== String)
    throw new Error('The "aggregateId" argument must be a string')
  if (!aggregateName)
    throw new Error('The "aggregateName" argument is required')
  if (!type) throw new Error('The "type" argument is required')
}

const getAggregateState = async (
  { projection, invariantHash = null },
  aggregateId,
  eventStore,
  snapshotAdapter = null
) => {
  const snapshotKey =
    projection != null && projection.constructor === Object
      ? `${invariantHash};${aggregateId}`
      : null

  if (
    (invariantHash == null || invariantHash.constructor !== String) &&
    snapshotAdapter != null &&
    snapshotKey != null
  ) {
    throw new Error(
      `Field 'invariantHash' is mandatory when using aggregate snapshots`
    )
  }

  let aggregateState = null
  let aggregateVersion = 0
  let lastTimestamp = -1

  try {
    if (snapshotKey == null) throw new Error()
    const snapshot = await snapshotAdapter.loadSnapshot(snapshotKey)
    aggregateVersion = snapshot.version
    aggregateState = snapshot.state
    lastTimestamp = snapshot.timestamp
  } catch (err) {}

  if (!(+lastTimestamp > 0) && projection != null) {
    aggregateState =
      typeof projection.Init === 'function' ? await projection.Init() : null
  }

  const regularHandler = async event => {
    aggregateVersion = event.aggregateVersion
    if (projection != null && typeof projection[event.type] === 'function') {
      aggregateState = await projection[event.type](aggregateState, event)
    }
  }

  const snapshotHandler = async event => {
    aggregateVersion = event.aggregateVersion
    if (projection != null && typeof projection[event.type] === 'function') {
      aggregateState = await projection[event.type](aggregateState, event)
    }

    lastTimestamp = event.timestamp - 1
    await snapshotAdapter.saveSnapshot(snapshotKey, {
      state: aggregateState,
      version: aggregateVersion,
      timestamp: lastTimestamp
    })
  }

  await eventStore.getEventsByAggregateId(
    aggregateId,
    snapshotAdapter != null && snapshotKey != null
      ? snapshotHandler
      : regularHandler,
    lastTimestamp
  )

  return { aggregateState, aggregateVersion }
}

const executeCommand = async (
  command,
  aggregate,
  eventStore,
  jwtToken,
  snapshotAdapter
) => {
  const { aggregateId, type } = command
  let { aggregateState, aggregateVersion } = await getAggregateState(
    aggregate,
    aggregateId,
    eventStore,
    snapshotAdapter
  )

  const handler = aggregate.commands[type]
  const event = await handler(
    aggregateState,
    command,
    jwtToken,
    aggregateVersion
  )

  if (!event.type) {
    throw new Error('event type is required')
  }

  event.aggregateId = aggregateId
  if (!event.aggregateVersion) {
    event.aggregateVersion = ++aggregateVersion
  }
  return event
}

function createExecutor({ eventStore, aggregate, snapshotAdapter }) {
  return async (command, jwtToken) => {
    const event = await executeCommand(
      command,
      aggregate,
      eventStore,
      jwtToken,
      snapshotAdapter
    )
    return await eventStore.saveEvent(event)
  }
}

export default ({ eventStore, aggregates, snapshotAdapter }) => {
  const executors = aggregates.reduce((result, aggregate) => {
    result[aggregate.name] = createExecutor({
      eventStore,
      aggregate,
      snapshotAdapter
    })
    return result
  }, {})

  return async ({ jwtToken, ...command }) => {
    await verifyCommand(command)
    const aggregateName = command.aggregateName

    if (!executors.hasOwnProperty(aggregateName)) {
      throw new Error(`Aggregate ${aggregateName} does not exist`)
    }

    return executors[aggregateName](command, jwtToken)
  }
}
