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
    if (aggregateVersion >= event.aggregateVersion) {
      throw new Error(
        `Invalid aggregate version in event storage by aggregateId = ${aggregateId}`
      )
    }
    aggregateVersion = event.aggregateVersion
    if (projection != null && typeof projection[event.type] === 'function') {
      aggregateState = await projection[event.type](aggregateState, event)
    }

    lastTimestamp = event.timestamp
  }

  const snapshotHandler = async event => {
    await regularHandler(event)

    await snapshotAdapter.saveSnapshot(snapshotKey, {
      state: aggregateState,
      version: aggregateVersion,
      timestamp: lastTimestamp - 1
    })
  }

  await eventStore.loadEvents(
    {
      aggregateIds: [aggregateId],
      startTime: lastTimestamp - 1,
      skipBus: true
    },
    snapshotAdapter != null && snapshotKey != null
      ? snapshotHandler
      : regularHandler
  )

  return { aggregateState, aggregateVersion, lastTimestamp }
}

const executeCommand = async (
  command,
  aggregate,
  eventStore,
  jwtToken,
  snapshotAdapter
) => {
  const { aggregateId, type } = command
  let {
    aggregateState,
    aggregateVersion,
    lastTimestamp
  } = await getAggregateState(
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
  event.aggregateVersion = aggregateVersion + 1
  event.timestamp = Math.max(Date.now(), lastTimestamp)

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

    await eventStore.saveEvent(event)

    return event
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
