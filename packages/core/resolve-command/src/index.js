const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
  if (!aggregateId) throw new Error('The "aggregateId" argument is required')
  if (aggregateId.constructor !== String)
    throw new Error('The "aggregateId" argument must be a string')
  if (!aggregateName)
    throw new Error('The "aggregateName" argument is required')
  if (!type) throw new Error('The "type" argument is required')
}

const getAggregateState = async (
  {
    projection: { Init, ...projection } = {},
    snapshotAdapter = null,
    snapshotBucketSize = 100,
    invariantHash = null
  },
  aggregateId,
  eventStore
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
  let appliedEvents = 0
  let lastTimestamp = 0

  try {
    if (snapshotKey == null) throw new Error()
    const snapshot = await snapshotAdapter.loadSnapshot(snapshotKey)
    aggregateVersion = snapshot.version
    aggregateState = snapshot.state
    lastTimestamp = snapshot.timestamp
  } catch (err) {}

  if (!(+lastTimestamp > 0)) {
    aggregateState = typeof Init === 'function' ? Init() : null
  }

  await eventStore.getEventsByAggregateId(
    aggregateId,
    event => {
      aggregateVersion = event.aggregateVersion
      const handler = projection && projection[event.type]
      if (typeof handler !== 'function') return

      aggregateState = handler(aggregateState, event)

      if (
        snapshotAdapter != null &&
        snapshotKey != null &&
        ++appliedEvents % snapshotBucketSize === 0
      ) {
        lastTimestamp = Date.now()
        snapshotAdapter.saveSnapshot(snapshotKey, {
          state: aggregateState,
          version: aggregateVersion,
          timestamp: lastTimestamp
        })
      }
    },
    lastTimestamp
  )

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

function createExecutor({ eventStore, aggregate }) {
  return async (command, jwtToken) => {
    const event = await executeCommand(command, aggregate, eventStore, jwtToken)
    return await eventStore.saveEvent(event)
  }
}

export default ({ eventStore, aggregates }) => {
  const executors = aggregates.reduce((result, aggregate) => {
    result[aggregate.name] = createExecutor({
      eventStore,
      aggregate
    })
    return result
  }, {})

  return async (command, jwtToken) => {
    await verifyCommand(command)
    const aggregateName = command.aggregateName

    if (!executors.hasOwnProperty(aggregateName)) {
      throw new Error(`Aggregate ${aggregateName} does not exist`)
    }

    return executors[aggregateName](command, jwtToken)
  }
}
