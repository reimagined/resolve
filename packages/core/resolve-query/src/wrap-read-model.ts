import { EOL } from 'os'
// TODO: core cannot reference "top-level" packages, move these to resolve-core
import { OMIT_BATCH, STOP_BATCH } from 'resolve-readmodel-base'
import getLog from './get-log'
import { WrapReadModelOptions, SerializedError, ReadModelPool } from './types'
import parseReadOptions from './parse-read-options'
import { SecretsManager } from 'resolve-core'

const RESERVED_TIME = 30 * 1000

const wrapConnection = async (
  pool: ReadModelPool,
  callback: Function
): Promise<any> => {
  const readModelName = pool.readModel.name
  const log = getLog(`wrapConnection:${readModelName}`)
  log.debug(`establishing connection`)
  const connection = await pool.connector.connect(readModelName)
  pool.connections.add(connection)

  log.debug(`retrieving event store secrets manager`)
  const secretsManager =
    typeof pool.getSecretsManager === 'function'
      ? await pool.getSecretsManager()
      : null

  try {
    return await callback(connection, secretsManager)
  } finally {
    log.debug(`disconnecting`)
    await pool.connector.disconnect(connection, readModelName)
    pool.connections.delete(connection)
  }
}

export const detectConnectorFeatures = (connector: any): number =>
  ((typeof connector.beginTransaction === 'function' ? 1 : 0) << 0) +
  ((typeof connector.commitTransaction === 'function' ? 1 : 0) << 1) +
  ((typeof connector.rollbackTransaction === 'function' ? 1 : 0) << 2) +
  ((typeof connector.beginXATransaction === 'function' ? 1 : 0) << 3) +
  ((typeof connector.commitXATransaction === 'function' ? 1 : 0) << 4) +
  ((typeof connector.rollbackXATransaction === 'function' ? 1 : 0) << 5) +
  ((typeof connector.beginEvent === 'function' ? 1 : 0) << 6) +
  ((typeof connector.commitEvent === 'function' ? 1 : 0) << 7) +
  ((typeof connector.rollbackEvent === 'function' ? 1 : 0) << 8) +
  ((typeof connector.subscribe === 'function' ? 1 : 0) << 9) +
  ((typeof connector.unsubscribe === 'function' ? 1 : 0) << 10) +
  ((typeof connector.resubscribe === 'function' ? 1 : 0) << 11) +
  ((typeof connector.deleteProperty === 'function' ? 1 : 0) << 12) +
  ((typeof connector.getProperty === 'function' ? 1 : 0) << 13) +
  ((typeof connector.listProperties === 'function' ? 1 : 0) << 14) +
  ((typeof connector.setProperty === 'function' ? 1 : 0) << 15) +
  ((typeof connector.resume === 'function' ? 1 : 0) << 16) +
  ((typeof connector.pause === 'function' ? 1 : 0) << 17) +
  ((typeof connector.reset === 'function' ? 1 : 0) << 18) +
  ((typeof connector.status === 'function' ? 1 : 0) << 19) +
  ((typeof connector.build === 'function' ? 1 : 0) << 20)

export const FULL_XA_CONNECTOR = 504
export const FULL_REGULAR_CONNECTOR = 7
export const EMPTY_CONNECTOR = 0
export const INLINE_LEDGER_CONNECTOR = 2096640

const emptyFunction = Promise.resolve.bind(Promise)
const emptyWrapper = {
  onBeforeEvent: emptyFunction,
  onSuccessEvent: emptyFunction,
  onFailEvent: emptyFunction,
}

const detectWrappers = (connector: any, bypass?: boolean): any => {
  const log = getLog('detectWrappers')
  if (bypass) {
    return emptyWrapper
  }

  const featureDetection = detectConnectorFeatures(connector)

  if (
    featureDetection === FULL_XA_CONNECTOR ||
    featureDetection === FULL_REGULAR_CONNECTOR + FULL_XA_CONNECTOR
  ) {
    return {
      onBeforeEvent: connector.beginEvent.bind(connector),
      onSuccessEvent: connector.commitEvent.bind(connector),
      onFailEvent: connector.rollbackEvent.bind(connector),
    }
  } else if (featureDetection === FULL_REGULAR_CONNECTOR) {
    return {
      onBeforeEvent: connector.beginTransaction.bind(connector),
      onSuccessEvent: connector.commitTransaction.bind(connector),
      onFailEvent: connector.rollbackTransaction.bind(connector),
    }
  } else if (
    featureDetection === INLINE_LEDGER_CONNECTOR ||
    featureDetection === EMPTY_CONNECTOR
  ) {
    return emptyWrapper
  } else {
    log.warn('Connector provided invalid event batch lifecycle functions set')
    log.warn(`Lifecycle detection constant is ${featureDetection}`)
    log.warn(`No-transactional lifecycle set will be used instead`)
    return emptyWrapper
  }
}

const serializeError = (
  error: (Error & { code?: number }) | null
): SerializedError | null =>
  error != null
    ? {
        name: error.name == null ? null : String(error.name),
        code: error.code == null ? null : String(error.code),
        message: String(error.message),
        stack: String(error.stack),
      }
    : null

const sendEvents = async (
  pool: ReadModelPool,
  {
    batchId,
    xaTransactionId,
    properties,
    events,
  }: {
    events: Array<any>
    xaTransactionId: any
    properties: any
    batchId: any
  }
): Promise<any> => {
  const { performAcknowledge, getRemainingTimeInMillis } = pool
  const readModelName = pool.readModel.name
  let result = null

  const log = getLog(`sendEvents:${readModelName}`)

  let lastSuccessEvent = null
  let lastFailedEvent = null
  let lastError: any = null

  try {
    if (pool.isDisposed) {
      throw new Error(`read-model "${readModelName}" is disposed`)
    }

    const projection = pool.readModel.projection
    if (projection == null) {
      throw new Error(
        `updating by events is prohibited when "${readModelName}" projection is not specified`
      )
    }

    const handler = async (
      connection: any,
      event: any,
      secretsManager: SecretsManager
    ): Promise<void> => {
      const log = getLog(
        `readModel:${readModelName}:[${event != null ? event.type : 'null'}]`
      )

      try {
        if (pool.isDisposed) {
          throw new Error(
            `read-model "${readModelName}" updating had been interrupted`
          )
        }
        if (event != null) {
          if (typeof projection[event.type] === 'function') {
            log.debug(`building read-model encryption`)
            const encryption =
              typeof pool.readModel.encryption === 'function'
                ? await pool.readModel.encryption(event, {
                    secretsManager,
                  })
                : null

            log.debug(`executing handler`)
            const executor = projection[event.type]
            await executor(connection, event, { ...encryption })
            log.debug(`handler executed successfully`)
            lastSuccessEvent = event
          } else if (event.type === 'Init') {
            lastSuccessEvent = event
          }
        }
      } catch (error) {
        log.error(error.message)
        log.verbose(error.stack)
        lastFailedEvent = event

        throw error
      }
    }

    await wrapConnection(
      pool,
      async (connection: any, secretsManager: SecretsManager): Promise<any> => {
        const log = getLog(`readModel:wrapConnection`)
        log.debug(
          `applying ${events.length} events to read-model "${readModelName}" started`
        )

        for (const event of events) {
          const remainingTime = getRemainingTimeInMillis() - RESERVED_TIME
          const { onBeforeEvent, onSuccessEvent, onFailEvent } = detectWrappers(
            pool.connector,
            event.type === 'Init'
          )

          log.debug(
            `remaining read-model "${readModelName}" feeding time is ${remainingTime} ms`
          )

          if (remainingTime < 0) {
            log.debug(
              `stop applying events to read-model "${readModelName}" because of timeout`
            )
            break
          }

          try {
            log.verbose(
              `Applying "${event.type}" event to read-model "${readModelName}" started`
            )
            await onBeforeEvent(connection, readModelName, xaTransactionId)

            try {
              await handler(connection, event, secretsManager)
              await onSuccessEvent(connection, readModelName, xaTransactionId)
            } catch (innerError) {
              if (innerError === STOP_BATCH) {
                await onSuccessEvent(connection, readModelName, xaTransactionId)
                break
              } else {
                throw innerError
              }
            }
            log.debug(
              `applying "${event.type}" event to read-model "${readModelName}" succeed`
            )
          } catch (readModelError) {
            if (readModelError === OMIT_BATCH) {
              throw OMIT_BATCH
            }
            log.error(
              `applying "${event.type}" event to read-model "${readModelName}" failed`
            )
            log.error(readModelError.message)
            log.verbose(readModelError.stack)
            let rollbackError = null
            try {
              await onFailEvent(connection, readModelName, xaTransactionId)
            } catch (error) {
              rollbackError = error
            }

            const summaryError = new Error()
            summaryError.message = readModelError.message
            summaryError.stack = readModelError.stack

            if (rollbackError != null) {
              summaryError.message = `${summaryError.message}${EOL}${rollbackError.message}`
              summaryError.stack = `${summaryError.stack}${EOL}${rollbackError.stack}`
            }

            log.verbose(
              `Throwing error for feeding read-model "${readModelName}"`,
              summaryError
            )
            throw summaryError
          }
        }
      }
    )
  } catch (error) {
    if (error === OMIT_BATCH) {
      return
    }

    log.error(error.message)
    log.verbose(error.stack)

    lastError = error
  }

  result = {
    eventSubscriber: readModelName,
    successEvent: lastSuccessEvent,
    failedEvent: lastFailedEvent,
    error: serializeError(lastError),
  }

  await performAcknowledge({
    result,
    batchId,
  })
}

const read = async (
  pool: ReadModelPool,
  { jwt, ...params }: any
): Promise<any> => {
  const { getSecretsManager, isDisposed, readModel, performanceTracer } = pool
  const readModelName = readModel.name

  const [resolverName, resolverArgs] = parseReadOptions(params)

  if (isDisposed) {
    throw new Error(`Read model "${readModelName}" is disposed`)
  }

  const segment = performanceTracer ? performanceTracer.getSegment() : null
  const subSegment = segment ? segment.addNewSubsegment('read') : null

  if (subSegment != null) {
    subSegment.addAnnotation('readModelName', readModelName)
    subSegment.addAnnotation('resolverName', resolverName)
    subSegment.addAnnotation('origin', 'resolve:query:read')
  }

  try {
    if (isDisposed) {
      throw new Error(`Read model "${readModelName}" is disposed`)
    }
    if (typeof pool.readModel.resolvers[resolverName] !== 'function') {
      const error = new Error(
        `Resolver "${resolverName}" does not exist`
      ) as any
      error.code = 422
      throw error
    }

    return await wrapConnection(
      pool,
      async (connection: any): Promise<any> => {
        const segment = performanceTracer
          ? performanceTracer.getSegment()
          : null
        const subSegment = segment ? segment.addNewSubsegment('resolver') : null

        if (subSegment != null) {
          subSegment.addAnnotation('readModelName', readModelName)
          subSegment.addAnnotation('resolverName', resolverName)
          subSegment.addAnnotation('origin', 'resolve:query:resolver')
        }

        try {
          return {
            data: await readModel.resolvers[resolverName](
              connection,
              resolverArgs,
              {
                secretsManager:
                  typeof getSecretsManager === 'function'
                    ? await getSecretsManager()
                    : null,
                jwt,
              }
            ),
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

const serializeState = async (
  pool: ReadModelPool,
  { state }: any
): Promise<string> => {
  return JSON.stringify(state, null, 2)
}

const doOperation = async (
  operationName: string,
  prepareArguments: Function | null,
  pool: ReadModelPool,
  parameters: any
): Promise<any> => {
  const readModelName = pool.readModel.name

  if (pool.isDisposed) {
    throw new Error(`read-model "${readModelName}" is disposed`)
  }

  let result = null

  await wrapConnection(
    pool,
    async (connection: any): Promise<any> => {
      const originalArgs = [connection, readModelName, parameters]

      const args =
        prepareArguments != null
          ? prepareArguments(pool, ...originalArgs)
          : originalArgs

      result = await pool.connector[operationName](...args)
    }
  )

  return result
}

const drop = doOperation.bind(null, 'drop', null)

const beginXATransaction = doOperation.bind(null, 'beginXATransaction', null)
const commitXATransaction = doOperation.bind(null, 'commitXATransaction', null)
const rollbackXATransaction = doOperation.bind(
  null,
  'rollbackXATransaction',
  null
)

const next = async (
  pool: ReadModelPool,
  eventListener: string,
  ...args: any[]
) => {
  if (args.length > 0) {
    throw new TypeError('Next should be invoked with no arguments')
  }
  await pool.invokeEventBusAsync(eventListener, 'build')
}

const build = doOperation.bind(
  null,
  'build',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [
    connection,
    readModelName,
    connection,
    pool.readModel.projection,
    next.bind(null, pool, readModelName),
  ]
)

const reset = doOperation.bind(
  null,
  'reset',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [connection, readModelName, next.bind(null, pool, readModelName)]
)

const resume = doOperation.bind(
  null,
  'resume',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [connection, readModelName, next.bind(null, pool, readModelName)]
)
const pause = doOperation.bind(
  null,
  'pause',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [connection, readModelName]
)

const subscribe = doOperation.bind(
  null,
  'subscribe',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => [
    connection,
    readModelName,
    parameters.subscriptionOptions.eventTypes,
    parameters.subscriptionOptions.aggregateIds,
  ]
)

const resubscribe = doOperation.bind(
  null,
  'resubscribe',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => [
    connection,
    readModelName,
    parameters.subscriptionOptions.eventTypes,
    parameters.subscriptionOptions.aggregateIds,
  ]
)

const unsubscribe = doOperation.bind(
  null,
  'unsubscribe',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [connection, readModelName]
)

const deleteProperty = doOperation.bind(
  null,
  'deleteProperty',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {
      key: string
    }
  ) => [connection, readModelName, parameters.key]
)
const getProperty = doOperation.bind(
  null,
  'getProperty',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {
      key: string
    }
  ) => [connection, readModelName, parameters.key]
)

const listProperties = doOperation.bind(
  null,
  'listProperties',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [connection, readModelName]
)
const setProperty = doOperation.bind(
  null,
  'setProperty',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {
      key: string
      value: any
    }
  ) => [connection, readModelName, parameters.key, parameters.value]
)

const status = doOperation.bind(
  null,
  'status',
  (
    pool: ReadModelPool,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => [connection, readModelName]
)

const dispose = async (pool: ReadModelPool): Promise<void> => {
  const readModelName = pool.readModel.name
  if (pool.isDisposed) {
    throw new Error(`read-model "${readModelName}" is disposed`)
  }
  pool.isDisposed = true

  const promises = []
  for (const connection of pool.connections) {
    promises.push(pool.connector.disconnect(connection, readModelName))
  }
  await Promise.all(promises)
}

const wrapReadModel = ({
  readModel,
  readModelConnectors,
  eventstoreAdapter,
  invokeEventBusAsync,
  performanceTracer,
  getRemainingTimeInMillis,
  performAcknowledge,
}: WrapReadModelOptions) => {
  const log = getLog(`readModel:wrapReadModel:${readModel.name}`)
  const getSecretsManager = eventstoreAdapter.getSecretsManager.bind(null)

  log.debug(`wrapping read-model`)
  const connector = readModelConnectors[readModel.connectorName]
  if (connector == null) {
    throw new Error(
      `connector "${readModel.connectorName}" for read-model "${readModel.name}" does not exist`
    )
  }

  const pool: ReadModelPool = {
    invokeEventBusAsync,
    eventstoreAdapter,
    connections: new Set(),
    readModel,
    connector,
    isDisposed: false,
    performanceTracer,
    getSecretsManager,
    getRemainingTimeInMillis,
    performAcknowledge,
  }

  const api = {
    read: read.bind(null, pool),
    sendEvents: sendEvents.bind(null, pool),
    serializeState: serializeState.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool),
  }

  log.debug(`detecting connector features`)

  const detectedFeatures = detectConnectorFeatures(connector)

  log.verbose(detectedFeatures)

  if (
    detectedFeatures === FULL_XA_CONNECTOR ||
    detectedFeatures === FULL_XA_CONNECTOR + FULL_REGULAR_CONNECTOR
  ) {
    Object.assign(api, {
      beginXATransaction: beginXATransaction.bind(null, pool),
      commitXATransaction: commitXATransaction.bind(null, pool),
      rollbackXATransaction: rollbackXATransaction.bind(null, pool),
    })
  } else if (detectedFeatures === INLINE_LEDGER_CONNECTOR) {
    Object.assign(api, {
      subscribe: subscribe.bind(null, pool),
      unsubscribe: unsubscribe.bind(null, pool),
      resubscribe: resubscribe.bind(null, pool),
      deleteProperty: deleteProperty.bind(null, pool),
      getProperty: getProperty.bind(null, pool),
      listProperties: listProperties.bind(null, pool),
      setProperty: setProperty.bind(null, pool),
      resume: resume.bind(null, pool),
      pause: pause.bind(null, pool),
      reset: reset.bind(null, pool),
      status: status.bind(null, pool),
      build: build.bind(null, pool),
    })
  }

  log.debug(`read-model wrapped successfully`)

  return Object.freeze(api)
}

export default wrapReadModel
