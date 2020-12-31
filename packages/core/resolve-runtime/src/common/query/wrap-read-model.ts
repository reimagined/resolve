import { EOL } from 'os'
// TODO: core cannot reference "top-level" packages, move these to resolve-core
import { OMIT_BATCH, STOP_BATCH } from 'resolve-readmodel-base'
import { SecretsManager, makeMonitoringSafe, Monitoring } from 'resolve-core'
import { ReadModelInterop, SagaInterop } from 'resolve-runtime-interop'

import getLog from './get-log'

import { WrapReadModelOptions, SerializedError, ReadModelPool } from './types'
import parseReadOptions from './parse-read-options'

const wrapConnection = async (
  pool: ReadModelPool,
  interop: ReadModelInterop | SagaInterop,
  callback: Function
): Promise<any> => {
  const readModelName = interop.name
  const log = getLog(`wrapConnection:${readModelName}`)
  log.debug(`establishing connection`)
  const connection = await pool.connector.connect(readModelName)
  pool.connections.add(connection)

  log.debug(`retrieving event store secrets manager`)
  const secretsManager =
    typeof pool.eventstoreAdapter.getSecretsManager === 'function'
      ? await pool.eventstoreAdapter.getSecretsManager()
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
const emptyEventWrapper = {
  onBeforeEvent: emptyFunction,
  onSuccessEvent: emptyFunction,
  onFailEvent: emptyFunction,
}

const emptyBatchWrapper = {
  onBeforeBatch: emptyFunction,
  onSuccessBatch: emptyFunction,
  onFailBatch: emptyFunction,
}

const detectEventWrappers = (connector: any): any => {
  const log = getLog('detectEventWrappers')
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
  } else if (
    featureDetection === FULL_REGULAR_CONNECTOR ||
    featureDetection === INLINE_LEDGER_CONNECTOR ||
    featureDetection === EMPTY_CONNECTOR
  ) {
    return emptyEventWrapper
  } else {
    log.warn('Connector provided invalid event batch lifecycle functions set')
    log.warn(`Lifecycle detection constant is ${featureDetection}`)
    log.warn(`No-transactional lifecycle set will be used instead`)
    return emptyEventWrapper
  }
}

const detectBatchWrappers = (connector: any): any => {
  const log = getLog('detectEventWrappers')
  const featureDetection = detectConnectorFeatures(connector)

  if (
    featureDetection === FULL_XA_CONNECTOR ||
    featureDetection === FULL_REGULAR_CONNECTOR + FULL_XA_CONNECTOR
  ) {
    return {
      onBeforeBatch: emptyFunction,
      onSuccessBatch: emptyFunction,
      onFailBatch: emptyFunction,
    }
  } else if (featureDetection === FULL_REGULAR_CONNECTOR) {
    return {
      onBeforeBatch: connector.beginTransaction.bind(connector),
      onSuccessBatch: connector.commitTransaction.bind(connector),
      onFailBatch: connector.rollbackTransaction.bind(connector),
    }
  } else if (
    featureDetection === INLINE_LEDGER_CONNECTOR ||
    featureDetection === EMPTY_CONNECTOR
  ) {
    return emptyBatchWrapper
  } else {
    log.warn('Connector provided invalid event batch lifecycle functions set')
    log.warn(`Lifecycle detection constant is ${featureDetection}`)
    log.warn(`No-transactional lifecycle set will be used instead`)
    return emptyBatchWrapper
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
  interop: ReadModelInterop | SagaInterop,
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
  const { performAcknowledge, getVacantTimeInMillis } = pool
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
      interop,
      async (connection: any, secretsManager: SecretsManager): Promise<any> => {
        const log = getLog(`readModel:wrapConnection`)
        log.debug(
          `applying ${events.length} events to read-model "${readModelName}" started`
        )

        if (
          events.length === 1 &&
          events[0] != null &&
          events[0].type === 'Init'
        ) {
          try {
            log.verbose(
              `Applying "Init" event to read-model "${readModelName}" started`
            )

            try {
              await handler(connection, events[0], secretsManager)
            } catch (innerError) {
              if (innerError !== STOP_BATCH) {
                throw innerError
              }
            }
            log.debug(
              `applying "Init" event to read-model "${readModelName}" succeed`
            )
          } catch (readModelError) {
            if (readModelError === OMIT_BATCH) {
              throw OMIT_BATCH
            }
            log.error(
              `applying "Init" event to read-model "${readModelName}" failed`
            )
            log.error(readModelError.message)
            log.verbose(readModelError.stack)

            const summaryError = readModelError
            log.verbose(
              `Throwing error for "Init" applying to read-model "${readModelName}"`,
              summaryError
            )
            throw summaryError
          }
        } else if (
          events.length > 0 &&
          events.findIndex((event) => event.type === 'Init') < 0
        ) {
          const {
            onBeforeBatch,
            onSuccessBatch,
            onFailBatch,
          } = detectBatchWrappers(pool.connector)

          await onBeforeBatch(connection, readModelName, xaTransactionId)
          for (const event of events) {
            const remainingTime = getVacantTimeInMillis()
            const {
              onBeforeEvent,
              onSuccessEvent,
              onFailEvent,
            } = detectEventWrappers(pool.connector)

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
                  await onSuccessEvent(
                    connection,
                    readModelName,
                    xaTransactionId
                  )
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

              rollbackError = null
              try {
                await onFailBatch(connection, readModelName, xaTransactionId)
              } catch (error) {
                rollbackError = error
              }

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

          await onSuccessBatch(connection, readModelName, xaTransactionId)
        } else {
          throw new Error(
            `Init-based and event-based batches should be segregated`
          )
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
  interop: ReadModelInterop | SagaInterop,
  { jwt, ...params }: any
): Promise<any> => {
  const { isDisposed, performanceTracer, monitoring } = pool

  const readModelName = interop.name

  if (isDisposed) {
    throw new Error(`Read model "${readModelName}" is disposed`)
  }

  const [resolverName, resolverArgs] = parseReadOptions(params)

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
    const resolver = await interop.acquireResolver(resolverName, resolverArgs, {
      jwt,
    })
    return await wrapConnection(pool, interop, resolver)
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }

    await monitoring?.error?.(error, 'readModelResolver', {
      readModelName,
      resolverName,
    })
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
  interop: ReadModelInterop | SagaInterop,
  parameters: any
): Promise<any> => {
  const readModelName = interop.name

  if (pool.isDisposed) {
    throw new Error(`read-model "${readModelName}" is disposed`)
  }

  let result = null

  await wrapConnection(
    pool,
    interop,
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

const provideLedger = async (
  pool: any,
  readModelName: string,
  inlineLedger: any
) => {
  try {
    if (typeof pool.readModel.setProperties === 'function') {
      await pool.readModel.provideLedger(inlineLedger)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Provide inline ledger for event listener ${readModelName} failed: ${error}`
    )
  }
}

const getEncryption = async (pool: any) => {
  const secretsManager =
    typeof pool.eventstoreAdapter.getSecretsManager === 'function'
      ? await pool.eventstoreAdapter.getSecretsManager()
      : null
  return async (event: any) => {
    const encryption =
      typeof pool.readModel.encryption === 'function'
        ? await pool.readModel.encryption(event, { secretsManager })
        : null

    return { ...encryption }
  }
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
    pool.getVacantTimeInMillis,
    provideLedger.bind(null, pool, readModelName),
    getEncryption.bind(null, pool),
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

const wrapProjectionHandler = <T extends Array<any>>(
  handler: (...args: T) => Promise<any>,
  readModelName: string,
  eventType: string,
  monitoring?: Monitoring
) => async (...args: T) => {
  try {
    return await handler(...args)
  } catch (error) {
    await monitoring?.error?.(error, 'readModelProjection', {
      readModelName,
      eventType,
    })
    throw error
  }
}

const wrapReadModel = ({
  readModel,
  interop,
  readModelConnectors,
  eventstoreAdapter,
  invokeEventBusAsync,
  performanceTracer,
  getVacantTimeInMillis,
  performAcknowledge,
  monitoring,
}: WrapReadModelOptions) => {
  const log = getLog(`readModel:wrapReadModel:${readModel.name}`)

  log.debug(`wrapping read-model`)
  const connector = readModelConnectors[readModel.connectorName]
  if (connector == null) {
    throw new Error(
      `connector "${readModel.connectorName}" for read-model "${readModel.name}" does not exist`
    )
  }

  const safeMonitoring =
    monitoring != null ? makeMonitoringSafe(monitoring) : monitoring

  const pool: ReadModelPool = {
    invokeEventBusAsync,
    eventstoreAdapter,
    connections: new Set(),
    readModel: {
      ...readModel,
      projection:
        readModel.projection != null
          ? Object.keys(readModel.projection).reduce(
              (acc, eventType) => ({
                ...acc,
                [eventType]: wrapProjectionHandler(
                  readModel.projection[eventType],
                  readModel.name,
                  eventType,
                  safeMonitoring
                ),
              }),
              {} as typeof readModel.projection
            )
          : readModel.projection,
    },
    connector,
    isDisposed: false,
    performanceTracer,
    getVacantTimeInMillis,
    performAcknowledge,
    monitoring: safeMonitoring,
  }

  const api = {
    read: read.bind(null, pool, interop),
    sendEvents: sendEvents.bind(null, pool, interop),
    serializeState: serializeState.bind(null, pool, interop),
    drop: drop.bind(null, pool, interop),
    dispose: dispose.bind(null, pool, interop),
  }

  log.debug(`detecting connector features`)

  const detectedFeatures = detectConnectorFeatures(connector)

  log.verbose(detectedFeatures)

  if (
    detectedFeatures === FULL_XA_CONNECTOR ||
    detectedFeatures === FULL_XA_CONNECTOR + FULL_REGULAR_CONNECTOR
  ) {
    Object.assign(api, {
      beginXATransaction: beginXATransaction.bind(null, pool, interop),
      commitXATransaction: commitXATransaction.bind(null, pool, interop),
      rollbackXATransaction: rollbackXATransaction.bind(null, pool, interop),
    })
  } else if (detectedFeatures === INLINE_LEDGER_CONNECTOR) {
    Object.assign(api, {
      subscribe: subscribe.bind(null, pool, interop),
      unsubscribe: unsubscribe.bind(null, pool, interop),
      resubscribe: resubscribe.bind(null, pool, interop),
      deleteProperty: deleteProperty.bind(null, pool, interop),
      getProperty: getProperty.bind(null, pool, interop),
      listProperties: listProperties.bind(null, pool, interop),
      setProperty: setProperty.bind(null, pool, interop),
      resume: resume.bind(null, pool, interop),
      pause: pause.bind(null, pool, interop),
      reset: reset.bind(null, pool, interop),
      status: status.bind(null, pool, interop),
      build: build.bind(null, pool, interop),
    })
  }

  log.debug(`read-model wrapped successfully`)

  return Object.freeze(api)
}

export default wrapReadModel
