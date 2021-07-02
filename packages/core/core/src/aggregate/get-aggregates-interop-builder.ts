import {
  AggregatesInteropBuilder,
  AggregateInteropMap,
  AggregateInterop,
  AggregateRuntime,
} from './types'
import { CommandError } from '../errors'
import { AggregateMeta, MiddlewareContext } from '../types/runtime'
import { getLog } from '../get-log'
import { getPerformanceTracerSubsegment } from '../utils'
import {
  Event,
  AggregateState,
  Command,
  CommandContext,
  CommandHandler,
  CommandResult,
} from '../types/core'
import { makeMiddlewareApplier } from '../helpers'

type AggregateData = {
  aggregateVersion: number
  aggregateId: string
  aggregateState: any
  cursor: any
  minimalTimestamp: number
  snapshotKey: string | null
}

const isInteger = (val: any): val is number =>
  val != null && parseInt(val) === val && val.constructor === Number
const isString = (val: any): val is string =>
  val != null && val.constructor === String

const generateCommandError = (message: string): CommandError =>
  new CommandError(message)

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

/*
const monitoredError = async (
  runtime: ReadModelRuntime,
  error: Error,
  meta: any
) => {
  await runtime.monitoring?.error?.(error, 'readModelResolver', meta)
  return error
}
*/

const getAggregateInterop = (aggregate: AggregateMeta): AggregateInterop => {
  const {
    name,
    commands,
    encryption,
    serializeState,
    deserializeState,
    invariantHash,
    projection,
  } = aggregate
  return {
    name,
    commands,
    projection,
    encryption,
    serializeState,
    deserializeState,
    invariantHash,
  }
}

const saveEvent = async (
  runtime: AggregateRuntime,
  aggregate: AggregateInterop,
  command: Command,
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

  const { eventstore, hooks: { preSaveEvent, postSaveEvent } = {} } = runtime

  const allowSave =
    typeof preSaveEvent === 'function'
      ? await preSaveEvent(aggregate, command, event)
      : true

  if (allowSave) {
    const eventWithCursor = await eventstore.saveEvent(event)

    if (typeof postSaveEvent === 'function') {
      await postSaveEvent(aggregate, command, event, eventWithCursor)
    }
  }

  return event
}

const projectionEventHandler = async (
  aggregate: AggregateInterop,
  runtime: AggregateRuntime,
  data: AggregateData,
  processSnapshot: Function | null,
  event: Event
): Promise<any> => {
  const { monitoring, eventstore } = runtime
  const subSegment = getPerformanceTracerSubsegment(monitoring, 'applyEvent')
  try {
    const { name: aggregateName } = aggregate

    subSegment.addAnnotation('aggregateName', aggregateName)
    subSegment.addAnnotation('eventType', event.type)
    subSegment.addAnnotation('origin', 'resolve:applyEvent')

    if (data.aggregateVersion >= event.aggregateVersion) {
      throw generateCommandError(
        `Incorrect order of events by aggregateId = "${data.aggregateId}"`
      )
    }
    data.aggregateVersion = event.aggregateVersion
    if (
      aggregate.projection != null &&
      typeof aggregate.projection[event.type] === 'function'
    ) {
      data.aggregateState = await aggregate.projection[event.type](
        data.aggregateState,
        event
      )
    }

    data.cursor = await eventstore.getNextCursor(data.cursor, [event])

    data.minimalTimestamp = event.timestamp

    if (typeof processSnapshot === 'function') {
      await processSnapshot(data)
    }
  } catch (error) {
    subSegment.addError(error)
    throw error
  } finally {
    subSegment.close()
  }
}

const takeSnapshot = async (
  aggregate: AggregateInterop,
  runtime: AggregateRuntime,
  data: AggregateData
): Promise<any> => {
  const { name: aggregateName } = aggregate
  const { monitoring, eventstore } = runtime
  const log = getLog(`takeSnapshot:${aggregateName}:${data.aggregateId}`)

  const subSegment = getPerformanceTracerSubsegment(monitoring, 'takeSnapshot')

  try {
    subSegment.addAnnotation('aggregateName', aggregateName)
    subSegment.addAnnotation('origin', 'resolve:takeSnapshot')

    log.debug(`invoking event store snapshot taking operation`)
    log.verbose(`version: ${data.aggregateVersion}`)
    log.verbose(`minimalTimestamp: ${data.minimalTimestamp}`)

    // FIXME: move snapshot business logic from runtime
    await eventstore.saveSnapshot(
      data.snapshotKey,
      JSON.stringify({
        state: aggregate.serializeState(data.aggregateState),
        version: data.aggregateVersion,
        minimalTimestamp: data.minimalTimestamp,
        cursor: data.cursor,
      })
    )

    log.debug(`snapshot processed`)
  } catch (error) {
    log.error(error.message)
    subSegment.addError(error)
    throw error
  } finally {
    subSegment.close()
  }
}

const getAggregateState = async (
  aggregate: AggregateInterop,
  runtime: AggregateRuntime,
  aggregateId: string
): Promise<any> => {
  const { monitoring, eventstore } = runtime
  const {
    name: aggregateName,
    projection,
    deserializeState,
    invariantHash = null,
  } = aggregate
  const log = getLog(`getAggregateState:${aggregateName}:${aggregateId}`)

  const subSegment = getPerformanceTracerSubsegment(
    monitoring,
    'getAggregateState'
  )

  try {
    subSegment.addAnnotation('aggregateName', aggregateName)
    subSegment.addAnnotation('origin', 'resolve:getAggregateState')

    const snapshotKey = checkOptionShape(projection, [Object])
      ? `AG;${invariantHash};${aggregateId}`
      : null

    if (!checkOptionShape(invariantHash, [String]) && snapshotKey != null) {
      throw generateCommandError(
        `Field "invariantHash" is required and must be a string when using aggregate snapshots`
      )
    }

    const aggregateData: AggregateData = {
      aggregateState: null,
      aggregateVersion: 0,
      minimalTimestamp: 0,
      cursor: null,
      aggregateId,
      snapshotKey,
    }

    try {
      if (snapshotKey == null) {
        throw generateCommandError(`no snapshot key`)
      }

      // TODO: Restore (sealed)
      // if (projection == null) {
      //   const lastEvent = await pool.eventstoreAdapter.getLatestEvent({
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
        const subSegment = getPerformanceTracerSubsegment(
          monitoring,
          'loadSnapshot'
        )

        try {
          log.debug(`loading snapshot`)
          const snapshot = await eventstore.loadSnapshot(snapshotKey)

          if (snapshot != null && snapshot.constructor === String) {
            return JSON.parse(snapshot)
          }
          throw Error('invalid snapshot data')
        } catch (error) {
          subSegment.addError(error)
          throw error
        } finally {
          subSegment.close()
        }
      })()

      if (!(snapshot.cursor == null || isNaN(+snapshot.minimalTimestamp))) {
        log.verbose(`snapshot.version: ${snapshot.version}`)
        log.verbose(`snapshot.minimalTimestamp: ${snapshot.minimalTimestamp}`)

        Object.assign(aggregateData, {
          aggregateState: deserializeState(snapshot.state),
          aggregateVersion: snapshot.version,
          minimalTimestamp: snapshot.minimalTimestamp,
          cursor: snapshot.cursor,
        })
      }
    } catch (err) {
      log.verbose(err.message)
    }

    if (aggregateData.cursor == null && projection != null) {
      log.debug(`building the aggregate state from scratch`)
      aggregateData.aggregateState =
        typeof projection.Init === 'function' ? await projection.Init() : null
    }

    const eventHandler = (event: Event) =>
      projectionEventHandler(
        aggregate,
        runtime,
        aggregateData,
        snapshotKey != null
          ? (data: AggregateData) => takeSnapshot(aggregate, runtime, data)
          : null,
        event
      )

    await (async (): Promise<any> => {
      const subSegment = getPerformanceTracerSubsegment(
        monitoring,
        'loadEvents'
      )

      try {
        const { events } = await eventstore.loadEvents({
          aggregateIds: [aggregateId],
          cursor: aggregateData.cursor,
          limit: Number.MAX_SAFE_INTEGER,
        })

        log.debug(
          `loaded ${events.length} events starting from the last snapshot`
        )
        for (const event of events) {
          await eventHandler(event)
        }

        subSegment.addAnnotation('eventCount', events.length)
        subSegment.addAnnotation('origin', 'resolve:loadEvents')
      } catch (error) {
        log.error(error.message)
        subSegment.addError(error)
        throw error
      } finally {
        subSegment.close()
      }
    })()

    return aggregateData
  } catch (error) {
    log.error(error.message)
    subSegment.addError(error)
    throw error
  } finally {
    subSegment.close()
  }
}

const makeCommandExecutor = (
  aggregateMap: AggregateInteropMap,
  runtime: AggregateRuntime
) => {
  const { commandMiddlewares = [] } = runtime

  const applyMiddlewares = makeMiddlewareApplier(commandMiddlewares)

  const commandHandler: CommandHandler = async (
    state: AggregateState,
    command: Command,
    context: CommandContext
  ): Promise<CommandResult> => {
    const subSegment = getPerformanceTracerSubsegment(
      runtime.monitoring,
      'processCommand'
    )
    try {
      subSegment.addAnnotation('aggregateName', command.aggregateName)
      subSegment.addAnnotation('commandType', command.type)
      subSegment.addAnnotation('origin', 'resolve:processCommand')

      const aggregate = aggregateMap[command.aggregateName]

      return await aggregate.commands[command.type](state, command, context)
    } catch (error) {
      subSegment.addError(error)
      throw error
    } finally {
      subSegment.close()
    }
  }

  const chainedHandlers = applyMiddlewares(
    (middlewareContext, state, command, context) =>
      commandHandler(state, command, context)
  )

  return async (
    command: Command,
    middlewareContext: MiddlewareContext = {}
  ): Promise<CommandResult> => {
    const monitoringGroup =
      runtime.monitoring != null
        ? runtime.monitoring
            .group({ Part: 'Command' })
            .group({ AggregateName: command.aggregateName })
            .group({ Type: command.type })
        : null

    if (monitoringGroup != null) {
      monitoringGroup.time('Execution')
    }

    const { jwt: actualJwt, jwtToken: deprecatedJwt } = command

    const jwt = actualJwt || deprecatedJwt

    const subSegment = getPerformanceTracerSubsegment(
      runtime.monitoring,
      'executeCommand'
    )

    try {
      await verifyCommand(command)

      const { aggregateName, aggregateId, type } = command
      const log = getLog(
        `execute-command:${command.aggregateName}:${command.type}`
      )
      const aggregate = aggregateMap[aggregateName]

      subSegment.addAnnotation('aggregateName', aggregateName)
      subSegment.addAnnotation('commandType', command.type)
      subSegment.addAnnotation('origin', 'resolve:executeCommand')

      if (aggregate == null) {
        const error = generateCommandError(
          `Aggregate "${aggregateName}" does not exist`
        )
        log.error(error)
        throw error
      }

      const {
        aggregateState,
        aggregateVersion,
        minimalTimestamp,
      } = await getAggregateState(aggregate, runtime, aggregateId)

      if (!aggregate.commands.hasOwnProperty(type)) {
        throw generateCommandError(`Command type "${type}" does not exist`)
      }

      const { secretsManager } = runtime

      const encryption =
        typeof aggregate.encryption === 'function'
          ? await aggregate.encryption(aggregateId, {
              jwt,
              secretsManager,
            })
          : null

      const { encrypt, decrypt } = encryption || {}

      const context = {
        jwt,
        aggregateVersion,
        encrypt,
        decrypt,
      }

      const event = await chainedHandlers(
        middlewareContext,
        aggregateState,
        command,
        context
      )
      // const event = await commandHandler(aggregateState, command, context)

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

      const processedEvent: Event = {
        aggregateId,
        aggregateVersion: aggregateVersion + 1,
        timestamp: Math.max(minimalTimestamp + 1, Date.now()),
        type: event.type,
      }

      if (Object.prototype.hasOwnProperty.call(event, 'payload')) {
        processedEvent.payload = event.payload
      }

      await (async (): Promise<void> => {
        const subSegment = getPerformanceTracerSubsegment(
          runtime.monitoring,
          'saveEvent'
        )

        try {
          return await saveEvent(runtime, aggregate, command, processedEvent)
        } catch (error) {
          subSegment.addError(error)
          throw error
        } finally {
          subSegment.close()
        }
      })()

      return processedEvent
    } catch (error) {
      subSegment.addError(error)

      if (monitoringGroup != null) {
        monitoringGroup.error(error)
      }
      throw error
    } finally {
      if (monitoringGroup != null) {
        monitoringGroup.timeEnd('Execution')
      }

      subSegment.close()
    }
  }
}

export const getAggregatesInteropBuilder = (
  aggregates: AggregateMeta[]
): AggregatesInteropBuilder => (runtime) => {
  const aggregateMap = aggregates.reduce<AggregateInteropMap>((map, model) => {
    map[model.name] = getAggregateInterop(model)
    return map
  }, {})
  return {
    aggregateMap,
    executeCommand: makeCommandExecutor(aggregateMap, runtime),
  }
}
