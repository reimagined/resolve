const CommandError = function() {}
Object.setPrototypeOf(CommandError.prototype, Error.prototype)
export { CommandError }

const generateCommandError = message => {
  const error = new Error(message)
  Object.setPrototypeOf(error, CommandError.prototype)
  Object.defineProperties(error, {
    message: { value: error.message, enumerable: true },
    stack: { value: error.stack, enumerable: true }
  })
  return error
}

const checkOptionShape = (option, types, nullable = false) =>
  (nullable && option == null) ||
  !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )

const verifyCommand = async ({ aggregateId, aggregateName, type }) => {
  if (!checkOptionShape(aggregateId, [String])) {
    throw generateCommandError('The "aggregateId" argument must be a string')
  }
  if (!checkOptionShape(aggregateName, [String])) {
    throw generateCommandError('The "aggregateName" argument must be a string')
  }
  if (!checkOptionShape(type, [String])) {
    throw generateCommandError('The "type" argument must be a string')
  }
}

const regularHandler = async (pool, aggregateInfo, event) => {
  if (pool.isDisposed) {
    throw generateCommandError('Command handler is disposed')
  }

  if (aggregateInfo.aggregateVersion >= event.aggregateVersion) {
    throw generateCommandError(
      `Invalid aggregate version in event storage by aggregateId = ${
        aggregateInfo.aggregateId
      }`
    )
  }
  aggregateInfo.aggregateVersion = event.aggregateVersion
  if (
    aggregateInfo.projection != null &&
    typeof aggregateInfo.projection[event.type] === 'function'
  ) {
    aggregateInfo.aggregateState = await aggregateInfo.projection[event.type](
      aggregateInfo.aggregateState,
      event
    )
  }

  aggregateInfo.lastTimestamp = event.timestamp
}

const snapshotHandler = async (pool, aggregateInfo, event) => {
  if (pool.isDisposed) {
    throw generateCommandError('Command handler is disposed')
  }

  if (event.aggregateVersion <= aggregateInfo.aggregateVersion) {
    return
  }

  await regularHandler(pool, aggregateInfo, event)

  await pool.snapshotAdapter.saveSnapshot(aggregateInfo.snapshotKey, {
    state: aggregateInfo.serializeState(aggregateInfo.aggregateState),
    version: aggregateInfo.aggregateVersion,
    timestamp: aggregateInfo.lastTimestamp - 1
  })
}

const getAggregateState = async (
  pool,
  { projection, serializeState, deserializeState, invariantHash = null },
  aggregateId
) => {
  const snapshotKey = checkOptionShape(projection, [Object])
    ? `${invariantHash};${aggregateId}`
    : null

  if (
    !checkOptionShape(invariantHash, [String], true) &&
    pool.snapshotAdapter != null &&
    snapshotKey != null
  ) {
    throw generateCommandError(
      `Field 'invariantHash' is mandatory when using aggregate snapshots`
    )
  }

  const aggregateInfo = {
    aggregateState: null,
    aggregateVersion: 0,
    lastTimestamp: -1,
    aggregateId,
    projection,
    serializeState,
    deserializeState,
    snapshotKey
  }

  try {
    if (snapshotKey == null) throw generateCommandError()
    const snapshot = await pool.snapshotAdapter.loadSnapshot(snapshotKey)

    Object.assign(aggregateInfo, {
      aggregateState: deserializeState(snapshot.state),
      aggregateVersion: snapshot.version,
      lastTimestamp: snapshot.timestamp
    })
  } catch (err) {}

  if (!(+aggregateInfo.lastTimestamp > 0) && projection != null) {
    aggregateInfo.aggregateState =
      typeof projection.Init === 'function' ? await projection.Init() : null
  }

  const eventHandler = (pool.snapshotAdapter != null && snapshotKey != null
    ? snapshotHandler
    : regularHandler
  ).bind(null, pool, aggregateInfo)

  await pool.eventStore.loadEvents(
    {
      aggregateIds: [aggregateId],
      startTime: aggregateInfo.lastTimestamp - 1
    },
    eventHandler
  )

  return aggregateInfo
}

const executeCommand = async (pool, { jwtToken, ...command }) => {
  await verifyCommand(command)
  const aggregateName = command.aggregateName
  const aggregate = pool.aggregates.find(({ name }) => aggregateName === name)

  if (aggregate == null) {
    throw generateCommandError(`Aggregate ${aggregateName} does not exist`)
  }

  const { aggregateId, type } = command
  let {
    aggregateState,
    aggregateVersion,
    lastTimestamp
  } = await getAggregateState(pool, aggregate, aggregateId)

  if (!aggregate.commands.hasOwnProperty(type)) {
    throw generateCommandError(`command type ${type} does not exist`)
  }

  const commandHandler = aggregate.commands[type]
  const event = await commandHandler(
    aggregateState,
    command,
    jwtToken,
    aggregateVersion
  )

  if (!checkOptionShape(event.type, [String])) {
    throw generateCommandError('event type is required')
  }

  if (
    event.aggregateId != null ||
    event.aggregateVersion != null ||
    event.timestamp != null
  ) {
    throw generateCommandError(
      'event should not contain "aggregateId", "aggregateVersion", "timestamp" fields'
    )
  }

  const processedEvent = {
    aggregateId,
    aggregateVersion: aggregateVersion + 1,
    timestamp: Math.max(Date.now(), lastTimestamp),
    type: event.type,
    payload: event.payload
  }

  await pool.eventStore.saveEvent(processedEvent)

  return processedEvent
}

const dispose = async pool => {
  if (pool.isDisposed) {
    throw generateCommandError('Command handler is disposed')
  }

  pool.isDisposed = true
}

export default ({ eventStore, aggregates, snapshotAdapter }) => {
  const pool = {
    eventStore,
    aggregates,
    snapshotAdapter,
    isDisposed: false
  }

  const api = {
    executeCommand: executeCommand.bind(null, pool),
    dispose: dispose.bind(null, pool)
  }

  const commandExecutor = executeCommand.bind(null, pool)
  Object.assign(commandExecutor, api)

  return commandExecutor
}
