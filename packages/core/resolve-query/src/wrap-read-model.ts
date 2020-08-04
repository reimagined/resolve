import { EOL } from 'os'
import getLog from './get-log'
// TODO: core cannot reference "top-level" packages, move these to resolve-core
import { OMIT_BATCH, STOP_BATCH } from 'resolve-readmodel-base'
import {
  detectConnectorFeatures,
  ReadModelConnectorFeatures
} from './connector-features'

const RESERVED_TIME = 30 * 1000

type ReadModelMeta = {
  name: string
  resolvers: { [key: string]: any }
  projection: { [key: string]: Function }
  connectorName: string
}

type ReadModelPool = {
  performanceTracer: any
  getSecretsManager: any
  isDisposed: boolean
  connector: any
  connections: Set<any>
  readModel: ReadModelMeta
}

const wrapConnection = async (
  pool: ReadModelPool,
  callback: Function
): Promise<any> => {
  const readModelName = pool.readModel.name

  const connection = await (async (): Promise<void> => {
    const segment = pool.performanceTracer
      ? pool.performanceTracer.getSegment()
      : null
    const subSegment = segment ? segment.addNewSubsegment('connect') : null

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('origin', 'resolve:query:connect')
    }

    try {
      return await pool.connector.connect(pool.readModel.name)
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

  pool.connections.add(connection)

  try {
    return await callback(connection)
  } finally {
    await (async (): Promise<void> => {
      const segment = pool.performanceTracer
        ? pool.performanceTracer.getSegment()
        : null
      const subSegment = segment ? segment.addNewSubsegment('disconnect') : null

      if (subSegment != null) {
        subSegment.addAnnotation('readModelName', readModelName)
        subSegment.addAnnotation('origin', 'resolve:query:disconnect')
      }

      try {
        await pool.connector.disconnect(connection, pool.readModel.name)

        pool.connections.delete(connection)
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
  }
}

const read = async (
  pool: ReadModelPool,
  resolverName: string,
  resolverArgs: object,
  jwt: string
): Promise<any> => {
  const { performanceTracer, getSecretsManager, isDisposed, readModel } = pool

  const segment = performanceTracer ? performanceTracer.getSegment() : null
  const subSegment = segment ? segment.addNewSubsegment('read') : null

  const readModelName = pool.readModel.name

  if (subSegment != null) {
    subSegment.addAnnotation('readModelName', readModelName)
    subSegment.addAnnotation('resolverName', resolverName)
    subSegment.addAnnotation('origin', 'resolve:query:read')
  }

  try {
    if (isDisposed) {
      throw new Error(`Read model "${pool.readModel.name}" is disposed`)
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
          return await readModel.resolvers[resolverName](
            connection,
            resolverArgs,
            {
              secretsManager:
                typeof getSecretsManager === 'function'
                  ? await getSecretsManager()
                  : null,
              jwt
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

const detectWrappers = (connector: any): any => {
  const log = getLog('detectWrappers')
  const emptyFunction = Promise.resolve.bind(Promise)
  const features = detectConnectorFeatures(connector)

  if (
    (features & ReadModelConnectorFeatures.XA) ===
    ReadModelConnectorFeatures.XA
  ) {
    return {
      onBeforeEvent: connector.beginEvent.bind(connector),
      onSuccessEvent: connector.commitEvent.bind(connector),
      onFailEvent: connector.rollbackEvent.bind(connector)
    }
  } else if (
    (features & ReadModelConnectorFeatures.Regular) ===
    ReadModelConnectorFeatures.Regular
  ) {
    return {
      onBeforeEvent: connector.beginTransaction.bind(connector),
      onSuccessEvent: connector.commitTransaction.bind(connector),
      onFailEvent: connector.rollbackTransaction.bind(connector)
    }
  } else {
    if (features !== ReadModelConnectorFeatures.None) {
      log.warn('Connector provided invalid event batch lifecycle functions set')
      log.warn(`Lifecycle detection constant is ${features}`)
      log.warn(`No-transactional lifecycle set will be used instead`)
    }

    return {
      onBeforeEvent: emptyFunction,
      onSuccessEvent: emptyFunction,
      onFailEvent: emptyFunction
    }
  }
}

const updateByEvents = async (
  pool: ReadModelPool,
  events: Array<any>,
  getRemainingTimeInMillis: Function,
  xaTransactionId: any
): Promise<any> => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('updateByEvents') : null
  const log = getLog(
    `updateByEvents:${
      pool && pool.readModel && pool.readModel.name
        ? pool.readModel.name
        : `UNKNOWN`
    }`
  )
  try {
    const readModelName = pool.readModel.name

    if (subSegment != null) {
      subSegment.addAnnotation('readModelName', readModelName)
      subSegment.addAnnotation('eventCount', events.length)
      subSegment.addAnnotation('origin', 'resolve:query:updateByEvents')
    }

    if (pool.isDisposed) {
      throw new Error(`read-model "${pool.readModel.name}" is disposed`)
    }

    const projection = pool.readModel.projection

    if (projection == null) {
      throw new Error(
        `updating by events is prohibited when "${pool.readModel.name}" projection is not specified`
      )
    }

    let lastSuccessEvent = null
    let lastFailedEvent = null
    let lastError: any = null

    const handler = async (connection: any, event: any): Promise<void> => {
      const log = getLog(
        `readModel:${readModelName}:[${event != null ? event.type : 'null'}]`
      )
      const segment = pool.performanceTracer
        ? pool.performanceTracer.getSegment()
        : null
      const subSegment = segment ? segment.addNewSubsegment('applyEvent') : null

      try {
        if (pool.isDisposed) {
          throw new Error(
            `read-model "${readModelName}" updating had been interrupted`
          )
        }

        if (subSegment != null) {
          subSegment.addAnnotation('readModelName', readModelName)
          subSegment.addAnnotation(
            'eventType',
            event != null ? event.type : 'null'
          )
          subSegment.addAnnotation('origin', 'resolve:query:applyEvent')
        }

        if (event != null) {
          if (typeof projection[event.type] === 'function') {
            log.debug(`executing handler`)
            const executor = projection[event.type]
            await executor(connection, event)
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

    await wrapConnection(
      pool,
      async (connection: any): Promise<any> => {
        const log = getLog(`readModel:wrapConnection`)
        try {
          log.debug(
            `applying ${events.length} events to read-model "${readModelName}" started`
          )

          const { onBeforeEvent, onSuccessEvent, onFailEvent } = detectWrappers(
            pool.connector
          )
          for (const event of events) {
            const remainingTime = getRemainingTimeInMillis() - RESERVED_TIME
            log.debug(
              `remaining read-model "${readModelName}" feeding time is ${remainingTime} ms`
            )

            if (remainingTime < 0) {
              log.debug(
                `stop applying events to read-model "${readModelName}" because of timeout`
              )
              break
            }

            if (event.type === 'Init') {
              try {
                log.debug(
                  `applying "Init" event to read-model "${readModelName}" started`
                )
                await handler(connection, event)
                log.debug(
                  `applying "Init" event to read-model "${readModelName}" succeed`
                )
                continue
              } catch (error) {
                log.error(
                  `applying "Init" event to read-model "${readModelName}" failed`
                )
                log.error(error.message)
                log.verbose(error.stack)
                throw error
              }
            }

            try {
              log.verbose(
                `Applying "${event.type}" event to read-model "${readModelName}" started`
              )
              await onBeforeEvent(
                connection,
                pool.readModel.name,
                xaTransactionId
              )

              await handler(connection, event)

              await onSuccessEvent(
                connection,
                pool.readModel.name,
                xaTransactionId
              )

              log.debug(
                `applying "${event.type}" event to read-model "${readModelName}" succeed`
              )
            } catch (readModelError) {
              if (
                readModelError === OMIT_BATCH ||
                readModelError === STOP_BATCH
              ) {
                throw readModelError
              }
              log.error(
                `applying "${event.type}" event to read-model "${readModelName}" failed`
              )
              log.error(readModelError.message)
              log.verbose(readModelError.stack)
              let rollbackError = null
              try {
                await onFailEvent(
                  connection,
                  pool.readModel.name,
                  xaTransactionId
                )
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
        } catch (error) {
          if (error === OMIT_BATCH) {
            lastError = error
          } else if (lastError == null && error === STOP_BATCH) {
            lastError = null
          } else {
            lastError = Object.create(Error.prototype, {
              name: { value: error.name, enumerable: true },
              code: { value: error.code, enumerable: true },
              message: { value: error.message, enumerable: true },
              stack: { value: error.stack, enumerable: true }
            })
          }
        }
      }
    )

    const result = {
      eventSubscriber: pool.readModel.name,
      successEvent: lastSuccessEvent,
      failedEvent: lastFailedEvent,
      error: lastError
    }

    if (lastError != null) {
      throw result
    } else {
      return result
    }
  } catch (error) {
    log.error(error.message)
    log.verbose(error.stack)
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

const readAndSerialize = async (
  pool: ReadModelPool,
  resolverName: string,
  resolverArgs: object,
  jwt: string
): Promise<string> => {
  const readModelName = pool.readModel.name

  if (pool.isDisposed) {
    throw new Error(`read-model "${readModelName}" is disposed`)
  }

  const result = await read(pool, resolverName, resolverArgs, jwt)

  return JSON.stringify(result, null, 2)
}

const doOperation = async (
  operationName: string,
  pool: ReadModelPool,
  parameters: any
): Promise<any> => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment(operationName) : null

  const readModelName = pool.readModel.name

  if (subSegment != null) {
    subSegment.addAnnotation('readModelName', readModelName)
    subSegment.addAnnotation('origin', `resolve:query:${operationName}`)
  }

  try {
    if (pool.isDisposed) {
      throw new Error(`read-model "${readModelName}" is disposed`)
    }

    let result = null

    await wrapConnection(
      pool,
      async (connection: any): Promise<any> => {
        result = await pool.connector[operationName](
          connection,
          pool.readModel.name,
          parameters
        )
      }
    )

    return result
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

const drop = doOperation.bind(null, 'drop')
const beginXATransaction = doOperation.bind(null, 'beginXATransaction')
const commitXATransaction = doOperation.bind(null, 'commitXATransaction')
const rollbackXATransaction = doOperation.bind(null, 'rollbackXATransaction')

const dispose = async (pool: ReadModelPool): Promise<void> => {
  const segment = pool.performanceTracer
    ? pool.performanceTracer.getSegment()
    : null
  const subSegment = segment ? segment.addNewSubsegment('dispose') : null

  const readModelName = pool.readModel.name

  if (subSegment != null) {
    subSegment.addAnnotation('readModelName', readModelName)
    subSegment.addAnnotation('origin', 'resolve:query:dispose')
  }

  try {
    if (pool.isDisposed) {
      throw new Error(`read-model "${pool.readModel.name}" is disposed`)
    }
    pool.isDisposed = true

    const promises = []
    for (const connection of pool.connections) {
      promises.push(pool.connector.disconnect(connection, pool.readModel.name))
    }
    await Promise.all(promises)
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

const wrapReadModel = (
  readModel: ReadModelMeta,
  readModelConnectors: { [key: string]: any },
  performanceTracer: any,
  getSecretsManager: any
) => {
  const log = getLog(`readModel:wrapReadModel:${readModel.name}`)

  log.debug(`wrapping read-model`)
  const connector = readModelConnectors[readModel.connectorName]
  if (connector == null) {
    throw new Error(
      `connector "${readModel.connectorName}" for read-model "${readModel.name}" does not exist`
    )
  }

  const pool = {
    connections: new Set(),
    readModel,
    connector,
    isDisposed: false,
    performanceTracer,
    getSecretsManager
  }

  const api = {
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    updateByEvents: updateByEvents.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool)
  }

  log.debug(`detecting connector features`)

  const features = detectConnectorFeatures(connector)

  log.verbose(features)

  if (
    (features & ReadModelConnectorFeatures.XA) ===
    ReadModelConnectorFeatures.XA
  ) {
    Object.assign(api, {
      beginXATransaction: beginXATransaction.bind(null, pool),
      commitXATransaction: commitXATransaction.bind(null, pool),
      rollbackXATransaction: rollbackXATransaction.bind(null, pool)
    })
  }

  log.debug(`read-model wrapped successfully`)

  return Object.freeze(api)
}

export default wrapReadModel
