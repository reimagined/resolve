import 'regenerator-runtime/runtime'
import invariantFunctionHash from 'invariant-function-hash'

const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
  if (!aggregateId) throw new Error('The "aggregateId" argument is required')
  if (!aggregateName)
    throw new Error('The "aggregateName" argument is required')
  if (!type) throw new Error('The "type" argument is required')
}

const emptySnapshotAdapter = Object.freeze({
  loadSnapshot: async () => ({ timestamp: 0, state: null, version: 0 }),
  saveSnapshot: () => null
})

const makeCommandHandlerHash = (projection, aggregateId) =>
  Object.keys(projection)
    .sort()
    .map(
      handlerName =>
        `${handlerName}:${invariantFunctionHash(projection[handlerName])}`
    )
    .join(',') + `;${aggregateId}`

const getAggregateState = async (
  { projection, initialState },
  aggregateId,
  eventStore,
  snapshotAdapter,
  snapshotBucketSize
) => {
  const snapshotKey =
    projection && projection.constructor === Object
      ? makeCommandHandlerHash(projection, aggregateId)
      : null

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
    aggregateState = initialState
  }

  await eventStore.getEventsByAggregateId(
    aggregateId,
    event => {
      aggregateVersion = event.aggregateVersion
      const handler = projection && projection[event.type]
      if (typeof handler !== 'function') return

      aggregateState = handler(aggregateState, event)

      if (snapshotKey != null && ++appliedEvents % snapshotBucketSize === 0) {
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

const executeCommand = async (
  command,
  aggregate,
  eventStore,
  jwtToken,
  snapshotAdapter,
  snapshotBucketSize
) => {
  const { aggregateId, type } = command
  let { aggregateState, aggregateVersion } = await getAggregateState(
    aggregate,
    aggregateId,
    eventStore,
    snapshotAdapter,
    snapshotBucketSize
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

function createExecutor({
  eventStore,
  aggregate,
  snapshotAdapter,
  snapshotBucketSize
}) {
  return async (command, jwtToken) => {
    const event = await executeCommand(
      command,
      aggregate,
      eventStore,
      jwtToken,
      snapshotAdapter,
      snapshotBucketSize
    )
    return await eventStore.saveEvent(event)
  }
}

export default ({
  eventStore,
  aggregates,
  snapshotAdapter = emptySnapshotAdapter,
  snapshotBucketSize = 100
}) => {
  const executors = aggregates.reduce((result, aggregate) => {
    result[aggregate.name.toLowerCase()] = createExecutor({
      eventStore,
      aggregate,
      snapshotAdapter,
      snapshotBucketSize
    })
    return result
  }, {})

  return async (command, jwtToken) => {
    await verifyCommand(command)
    const aggregateName = command.aggregateName.toLowerCase()
    return executors[aggregateName](command, jwtToken)
  }
}
