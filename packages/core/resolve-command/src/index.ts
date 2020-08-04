import {
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
  Command,
  CommandHandler,
  CommandResult,
  Event,
  SecretsManager
} from 'resolve-core'
import getLog from './get-log'

type EventPublisher = {
  publish: ({ event }: { event: Event }) => Promise<void>
}

type EventstoreAdapter = {
  getNextCursor: Function
  saveSnapshot: Function
  getSecretsManager: () => Promise<SecretsManager>
  loadSnapshot: (snapshotKey: string) => Promise<string | null>
  loadEvents: (param: {
    aggregateIds: string[]
    cursor: null
    limit: number
  }) => Promise<{
    events: any[]
  }>
}

type AggregateMeta = {
  name: string
  commands: Aggregate
  projection: AggregateProjection
  serializeState: Function
  deserializeState: Function
  encryption: AggregateEncryptionFactory | null
  invariantHash?: string
}

type CommandPool = {
  publisher: EventPublisher
  performanceTracer: any
  aggregateName: string
  isDisposed: boolean
  eventstoreAdapter: EventstoreAdapter
  aggregates: AggregateMeta[]
}

type AggregateInfo = {
  aggregateVersion: number
  aggregateId: string
  aggregateState: any
  projection: AggregateProjection
  cursor: any
  minimalTimestamp: number
  snapshotKey: string | null
  serializeState: Function
  deserializeState: Function
}

export type CommandExecutor = {
  (command: Command): Promise<CommandResult>
  dispose: () => Promise<void>
}

export type CommandExecutorBuilder = (context: {
  publisher: EventPublisher
  aggregates: AggregateMeta[]
  performanceTracer?: any
  eventstoreAdapter: EventstoreAdapter
}) => CommandExecutor

// eslint-disable-next-line no-new-func
const CommandError = Function()
Object.setPrototypeOf(CommandError.prototype, Error.prototype)
export { CommandError }

const generateCommandError = (message: string): Error => {
  const error = new Error(message)
  Object.setPrototypeOf(error, CommandError.prototype)
  Object.defineProperties(error, {
    name: { value: 'CommandError', enumerable: true },
    message: { value: error.message, enumerable: true },
    stack: { value: error.stack, enumerable: true }
  })
  return error
}

const checkOptionShape = (option: any, types: any[]): boolean =>
  !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )

const verifyCommand = ({ aggregateId, aggregateName, type }: Command): void => {
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

const projectionEventHandler = async (
  pool: CommandPool,
  aggregateInfo: AggregateInfo,
  processSnapshot: Function | null,
  event: Event
): Promise<any> => {
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

    aggregateInfo.cursor = await pool.eventstoreAdapter.getNextCursor(
      aggregateInfo.cursor,
      [event]
    )

    aggregateInfo.minimalTimestamp = event.timestamp

    if (typeof processSnapshot === 'function') {
      await processSnapshot(pool, aggregateInfo)
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
}

const takeSnapshot = async (
  pool: CommandPool,
  aggregateInfo: AggregateInfo
): Promise<any> => {
  const { aggregateName, performanceTracer, eventstoreAdapter } = pool

  const log = getLog(
    `takeSnapshot:${aggregateName}:${aggregateInfo.aggregateId}`
  )

  const segment = performanceTracer ? performanceTracer.getSegment() : null
  const subSegment = segment ? segment.addNewSubsegment('applySnapshot') : null

  try {
    if (subSegment != null) {
      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('origin', 'resolve:applySnapshot')
    }

    log.debug(`invoking event store snapshot taking operation`)
    log.verbose(`version: ${aggregateInfo.aggregateVersion}`)
    log.verbose(`minimalTimestamp: ${aggregateInfo.minimalTimestamp}`)

    await eventstoreAdapter.saveSnapshot(
      aggregateInfo.snapshotKey,
      JSON.stringify({
        state: aggregateInfo.serializeState(aggregateInfo.aggregateState),
        version: aggregateInfo.aggregateVersion,
        minimalTimestamp: aggregateInfo.minimalTimestamp,
        cursor: aggregateInfo.cursor
      })
    )

    log.debug(`snapshot processed`)
  } catch (error) {
    log.error(error.message)
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
  pool: CommandPool,
  meta: AggregateMeta,
  aggregateId: string
): Promise<any> => {
  const {
    aggregateName,
    performanceTracer,
    isDisposed,
    eventstoreAdapter
  } = pool
  const {
    projection,
    serializeState,
    deserializeState,
    invariantHash = null
  } = meta
  const log = getLog(`getAggregateState:${aggregateName}:${aggregateId}`)

  const segment = performanceTracer ? performanceTracer.getSegment() : null
  const subSegment = segment
    ? segment.addNewSubsegment('getAggregateState')
    : null

  try {
    if (subSegment != null) {
      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('origin', 'resolve:getAggregateState')
    }

    const snapshotKey = checkOptionShape(projection, [Object])
      ? `AG;${invariantHash};${aggregateId}`
      : null

    if (!checkOptionShape(invariantHash, [String]) && snapshotKey != null) {
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
      if (snapshotKey == null) {
        throw generateCommandError(`no snapshot key`)
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

      const snapshot = await (async (): Promise<any> => {
        const segment = performanceTracer
          ? performanceTracer.getSegment()
          : null
        const subSegment = segment
          ? segment.addNewSubsegment('loadSnapshot')
          : null

        try {
          if (isDisposed) {
            throw generateCommandError('Command handler is disposed')
          }

          log.debug(`loading snapshot`)
          const snapshot = await eventstoreAdapter.loadSnapshot(snapshotKey)

          if (snapshot != null && snapshot.constructor === String) {
            return JSON.parse(snapshot)
          }
          throw Error('invalid snapshot data')
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

      if (!(snapshot.cursor == null || isNaN(+snapshot.minimalTimestamp))) {
        log.verbose(`snapshot.version: ${snapshot.version}`)
        log.verbose(`snapshot.minimalTimestamp: ${snapshot.minimalTimestamp}`)

        Object.assign(aggregateInfo, {
          aggregateState: deserializeState(snapshot.state),
          aggregateVersion: snapshot.version,
          minimalTimestamp: snapshot.minimalTimestamp,
          cursor: snapshot.cursor
        })
      }
    } catch (err) {
      log.verbose(err.message)
    }

    if (aggregateInfo.cursor == null && projection != null) {
      log.debug(`building the aggregate state from scratch`)
      aggregateInfo.aggregateState =
        typeof projection.Init === 'function' ? await projection.Init() : null
    }

    const eventHandler =
      snapshotKey != null
        ? projectionEventHandler.bind(null, pool, aggregateInfo, takeSnapshot)
        : projectionEventHandler.bind(null, pool, aggregateInfo, null)

    await (async (): Promise<any> => {
      const segment = performanceTracer ? performanceTracer.getSegment() : null
      const subSegment = segment ? segment.addNewSubsegment('loadEvents') : null

      try {
        if (isDisposed) {
          throw generateCommandError('Command handler is disposed')
        }

        const { events } = await eventstoreAdapter.loadEvents({
          aggregateIds: [aggregateId],
          cursor: aggregateInfo.cursor,
          limit: Number.MAX_SAFE_INTEGER
        })

        log.debug(
          `loaded ${events.length} events starting from the last snapshot`
        )
        for (const event of events) {
          await eventHandler(event)
        }

        if (subSegment != null) {
          subSegment.addAnnotation('eventCount', events.length)
          subSegment.addAnnotation('origin', 'resolve:loadEvents')
        }
      } catch (error) {
        log.error(error.message)
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
    log.error(error.message)
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

const isInteger = (val: any): val is number =>
  val != null && parseInt(val) === val && val.constructor === Number
const isString = (val: any): val is string =>
  val != null && val.constructor === String

const saveEvent = async (
  publisher: EventPublisher,
  event: Event
): Promise<any> => {
  if (!isString(event.type)) {
    throw generateCommandError(`Event "type" field is invalid`)
  }
  if (!isString(event.aggregateId)) {
    throw generateCommandError('Event "aggregateId" field is invalid')
  }
  if (!isInteger(event.aggregateVersion)) {
    throw generateCommandError('Event "aggregateVersion" field is invalid')
  }
  if (!isInteger(event.timestamp)) {
    throw generateCommandError('Event "timestamp" field is invalid')
  }

  event.aggregateId = String(event.aggregateId)

  return publisher.publish({ event })
}

const executeCommand = async (
  pool: CommandPool,
  command: Command
): Promise<CommandResult> => {
  const { jwt } = command

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

    const commandHandler: CommandHandler = async (
      ...args
    ): Promise<CommandResult> => {
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

    const encryption =
      typeof aggregate.encryption === 'function'
        ? await aggregate.encryption(aggregateId, {
            jwt,
            secretsManager
          })
        : null

    const { encrypt = null, decrypt = null } = encryption || {
      encrypt: null,
      decrypt: null
    }

    const event = await commandHandler(aggregateState, command, {
      jwt,
      aggregateVersion,
      encrypt,
      decrypt
    })

    if (!checkOptionShape(event.type, [String])) {
      throw generateCommandError('Event "type" is required')
    }

    const runtimeEvent = event as any

    if (
      runtimeEvent.aggregateId != null ||
      runtimeEvent.aggregateVersion != null ||
      runtimeEvent.timestamp != null
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
      payload: event.payload as any
    }

    await (async (): Promise<void> => {
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

const dispose = async (pool: CommandPool): Promise<void> => {
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

const createCommand: CommandExecutorBuilder = ({
  publisher,
  aggregates,
  performanceTracer,
  eventstoreAdapter
}): CommandExecutor => {
  const pool = {
    publisher,
    aggregates,
    isDisposed: false,
    performanceTracer,
    eventstoreAdapter
  }

  const api = {
    executeCommand: executeCommand.bind(null, pool as any),
    dispose: dispose.bind(null, pool as any)
  }

  const commandExecutor = executeCommand.bind(null, pool as any)
  Object.assign(commandExecutor, api)

  return commandExecutor as CommandExecutor
}

export default createCommand
