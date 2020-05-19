import { getNextCursor } from 'resolve-eventstore-base'

// eslint-disable-next-line no-new-func
const CommandError = Function()
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

const checkOptionShape = (option, types) =>
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
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('applyEvent') : null

  try {
    const aggregateName = pool.aggregateName

    if (subSegment != null) {
      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('eventType', event.type)
      subSegment.addAnnotation('origin', 'resolve:applyEvent')
    }

    if (pool.isDisposed) {
      throw generateCommandError('Command handler is disposed')
    }

    if (aggregateInfo.aggregateVersion >= event.aggregateVersion) {
      throw generateCommandError(
        `Incorrect order of events by aggregateId = "${aggregateInfo.aggregateId}"`
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

    aggregateInfo.cursor = await pool.getNextCursor(aggregateInfo.cursor, [
      event
    ])

    aggregateInfo.minimalTimestamp = event.timestamp
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const snapshotHandler = async (pool, aggregateInfo, event) => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('applySnapshot') : null

  try {
    const aggregateName = pool.aggregateName

    if (subSegment != null) {
      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('origin', 'resolve:applySnapshot')
    }

    if (pool.isDisposed) {
      throw generateCommandError('Command handler is disposed')
    }

    if (event.aggregateVersion <= aggregateInfo.aggregateVersion) {
      return
    }

    await regularHandler(pool, aggregateInfo, event)

    await pool.snapshotAdapter.saveSnapshot(
      aggregateInfo.snapshotKey,
      JSON.stringify({
        state: aggregateInfo.serializeState(aggregateInfo.aggregateState),
        version: aggregateInfo.aggregateVersion,
        minimalTimestamp: aggregateInfo.minimalTimestamp,
        cursor: aggregateInfo.cursor
      })
    )
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const getAggregateState = async (
  pool,
  { projection, serializeState, deserializeState, invariantHash = null },
  aggregateId
) => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment
    ? segment.addNewSubsegment('getAggregateState')
    : null

  try {
    const aggregateName = pool.aggregateName

    if (subSegment != null) {
      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('origin', 'resolve:getAggregateState')
    }

    const snapshotKey = checkOptionShape(projection, [Object])
      ? `${invariantHash};${aggregateId}`
      : null

    if (
      !checkOptionShape(invariantHash, [String]) &&
      pool.snapshotAdapter != null &&
      snapshotKey != null
    ) {
      throw generateCommandError(
        `Field "invariantHash" is required and must be a string when using aggregate snapshots`
      )
    }

    const aggregateInfo = {
      aggregateState: null,
      aggregateVersion: 0,
      minimalTimestamp: 0,
      cursor: null,
      aggregateId,
      projection,
      serializeState,
      deserializeState,
      snapshotKey
    }

    try {
      if (snapshotKey == null || pool.snapshotAdapter == null) {
        throw generateCommandError()
      }

      // TODO: Restore
      // if (projection == null) {
      //   const lastEvent = await pool.publisher.getLatestEvent({
      //     aggregateIds: [aggregateId]
      //   })
      //   if (lastEvent != null) {
      //     await regularHandler(pool, aggregateInfo, lastEvent)
      //   }
      //
      //   aggregateInfo.cursor = null
      //   return aggregateInfo
      // }

      const snapshot = await (async () => {
        const segment = pool.performanceTracer
          ? pool.performanceTracer.getSegment()
          : null
        const subSegment = segment
          ? segment.addNewSubsegment('loadSnapshot')
          : null

        try {
          if (pool.isDisposed) {
            throw generateCommandError('Command handler is disposed')
          }

          return JSON.parse(
            await pool.snapshotAdapter.loadSnapshot(snapshotKey)
          )
        } catch (error) {
          if (subSegment != null) {
            subSegment.addError(error)
          }
          throw error
        } finally {
          if (subSegment != null) {
            subSegment.close()
          }
        }
      })()

      if (snapshot.cursor == null || isNaN(+snapshot.minimalTimestamp)) {
        throw new Error('Invalidating snapshot')
      }

      Object.assign(aggregateInfo, {
        aggregateState: deserializeState(snapshot.state),
        aggregateVersion: snapshot.version,
        minimalTimestamp: snapshot.minimalTimestamp,
        cursor: snapshot.cursor
      })
    } catch (err) {}

    if (aggregateInfo.cursor == null && projection != null) {
      aggregateInfo.aggregateState =
        typeof projection.Init === 'function' ? await projection.Init() : null
    }

    const eventHandler = (pool.snapshotAdapter != null && snapshotKey != null
      ? snapshotHandler
      : regularHandler
    ).bind(null, pool, aggregateInfo)

    await (async () => {
      const segment = pool.performanceTracer
        ? pool.performanceTracer.getSegment()
        : null
      const subSegment = segment ? segment.addNewSubsegment('loadEvents') : null

      try {
        if (pool.isDisposed) {
          throw generateCommandError('Command handler is disposed')
        }

        const { events } = await pool.publisher.read({
          aggregateIds: [aggregateId],
          cursor: aggregateInfo.cursor,
          limit: Number.MAX_SAFE_INTEGER
        })

        for (const event of events) {
          await eventHandler(event)
        }

        if (subSegment != null) {
          subSegment.addAnnotation('eventCount', events.length)
          subSegment.addAnnotation('origin', 'resolve:loadEvents')
        }
      } catch (error) {
        if (subSegment != null) {
          subSegment.addError(error)
        }
        throw error
      } finally {
        if (subSegment != null) {
          subSegment.close()
        }
      }
    })()

    return aggregateInfo
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const isInteger = val =>
  val != null && val.constructor === Number && parseInt(val) === val
const isString = val => val != null && val.constructor === String

const saveEvent = async (publisher, event) => {
  if (!isString(event.type)) {
    throw new Error('The `type` field is invalid')
  }
  if (!isString(event.aggregateId)) {
    throw new Error('The `aggregateId` field is invalid')
  }
  if (!isInteger(event.aggregateVersion)) {
    throw new Error('The `aggregateVersion` field is invalid')
  }
  if (!isInteger(event.timestamp)) {
    throw new Error('The `timestamp` field is invalid')
  }

  event.aggregateId = String(event.aggregateId)

  return await publisher.publish(event)
}

const executeCommand = async (pool, { jwtToken, ...command }) => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('executeCommand') : null

  try {
    await verifyCommand(command)
    const aggregateName = command.aggregateName
    const aggregate = pool.aggregates.find(({ name }) => aggregateName === name)

    if (subSegment != null) {
      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('commandType', command.type)
      subSegment.addAnnotation('origin', 'resolve:executeCommand')
    }

    pool.aggregateName = aggregateName

    if (aggregate == null) {
      throw generateCommandError(`Aggregate "${aggregateName}" does not exist`)
    }

    const { aggregateId, type } = command
    const {
      aggregateState,
      aggregateVersion,
      minimalTimestamp
    } = await getAggregateState(pool, aggregate, aggregateId)

    if (!aggregate.commands.hasOwnProperty(type)) {
      throw generateCommandError(`Command type "${type}" does not exist`)
    }

    const commandHandler = async (...args) => {
      const segment = pool.performanceTracer
        ? pool.performanceTracer.getSegment()
        : null
      const subSegment = segment
        ? segment.addNewSubsegment('processCommand')
        : null
      try {
        if (subSegment != null) {
          subSegment.addAnnotation('aggregateName', aggregateName)
          subSegment.addAnnotation('commandType', command.type)
          subSegment.addAnnotation('origin', 'resolve:processCommand')
        }

        return await aggregate.commands[type](...args)
      } catch (error) {
        if (subSegment != null) {
          subSegment.addError(error)
        }
        throw error
      } finally {
        if (subSegment != null) {
          subSegment.close()
        }
      }
    }

    const secretsManager = await pool.eventstoreAdapter.getSecretsManager()

    const { encrypt, decrypt } = await aggregate.encryption(aggregateId, {
      jwt: jwtToken,
      secretsManager
    })

    const event = await commandHandler(aggregateState, command, {
      jwt: jwtToken,
      aggregateVersion,
      encrypt,
      decrypt
    })

    if (!checkOptionShape(event.type, [String])) {
      throw generateCommandError('Event "type" is required')
    }

    if (
      event.aggregateId != null ||
      event.aggregateVersion != null ||
      event.timestamp != null
    ) {
      throw generateCommandError(
        'Event should not contain "aggregateId", "aggregateVersion", "timestamp" fields'
      )
    }

    const processedEvent = {
      aggregateId,
      aggregateVersion: aggregateVersion + 1,
      timestamp: Math.max(minimalTimestamp + 1, Date.now()),
      type: event.type,
      payload: event.payload
    }

    await (async () => {
      const segment = pool.performanceTracer
        ? pool.performanceTracer.getSegment()
        : null
      const subSegment = segment ? segment.addNewSubsegment('saveEvent') : null

      try {
        return await saveEvent(pool.publisher, processedEvent)
      } catch (error) {
        if (subSegment != null) {
          subSegment.addError(error)
        }
        throw error
      } finally {
        if (subSegment != null) {
          subSegment.close()
        }
      }
    })()

    return processedEvent
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const dispose = async pool => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('dispose') : null

  try {
    if (pool.isDisposed) {
      throw generateCommandError('Command handler is disposed')
    }

    pool.isDisposed = true
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const createCommand = ({
  publisher,
  aggregates,
  eventstoreAdapter,
  snapshotAdapter,
  performanceTracer,
  eventstoreAdapter
}) => {
  const pool = {
    publisher,
    aggregates,
    snapshotAdapter,
    eventstoreAdapter,
    isDisposed: false,
    performanceTracer,
    getNextCursor,
    eventstoreAdapter
  }

  const api = {
    executeCommand: executeCommand.bind(null, pool),
    dispose: dispose.bind(null, pool)
  }

  const commandExecutor = executeCommand.bind(null, pool)
  Object.assign(commandExecutor, api)

  return commandExecutor
}

export default createCommand
