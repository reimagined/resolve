import {
  makeMonitoringSafe,
  ReadModelInterop,
  SagaInterop,
} from '@resolve-js/core'
import getLog from './get-log'
import { WrapReadModelOptions, ReadModelPool } from './types'
import parseReadOptions from './parse-read-options'
import { OMIT_BATCH, STOP_BATCH } from './batch'

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

  try {
    return await callback(connection)
  } finally {
    log.debug(`disconnecting`)
    await pool.connector.disconnect(connection, readModelName)
    pool.connections.delete(connection)
  }
}

const read = async (
  pool: ReadModelPool,
  interop: ReadModelInterop | SagaInterop,
  { jwt, ...params }: any
): Promise<any> => {
  const { isDisposed, performanceTracer, monitoring } = pool

  const readModelName = interop.name

  const log = getLog(`read:${readModelName}`)

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
      const error = new Error(`Read model "${readModelName}" is disposed`)
      await monitoring?.error?.(error, 'readModelResolver', {
        readModelName,
        resolverName,
      })
      if (subSegment != null) {
        subSegment.addError(error)
      }
      throw error
    }
    const resolver = await interop.acquireResolver(resolverName, resolverArgs, {
      jwt,
    })
    log.debug(`invoking resolver`)
    const result = await wrapConnection(pool, interop, resolver)
    log.verbose(result)
    return result
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const serializeState = async ({ state }: { state: any }): Promise<string> => {
  return JSON.stringify(state, null, 2)
}

const next = async (
  pool: ReadModelPool,
  eventListener: string,
  ...args: any[]
) => {
  if (args.length > 0) {
    throw new TypeError('Next should be invoked with no arguments')
  }
  await pool.invokeEventSubscriberAsync(eventListener, 'build')
}

const updateCustomReadModel = async (
  pool: ReadModelPool,
  readModelName: string,
  nextStatus: any,
  condition?: Function
) => {
  const { status } = (
    await pool.eventstoreAdapter.getEventSubscribers({
      applicationName: pool.applicationName,
      eventSubscriber: readModelName,
    })
  )[0] ?? { status: null }

  if (
    status == null ||
    (typeof condition === 'function' && !(await condition(status)))
  ) {
    return
  }

  await pool.eventstoreAdapter.ensureEventSubscriber({
    applicationName: pool.applicationName,
    eventSubscriber: readModelName,
    status: {
      ...status,
      ...nextStatus,
    },
    updateOnly: true,
  })
}

export const customReadModelMethods = {
  build: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => {
    const log = getLog(`build:${readModelName}`)
    let lastSuccessEvent = null
    let lastFailedEvent = null
    let lastError: any = null
    let nextCursor: any = null
    let status: any = null
    try {
      if (pool.isDisposed) {
        throw new Error(`read-model "${readModelName}" is disposed`)
      }
      log.debug(`applying events to read-model "${readModelName}" started`)
      void ({ status } = (
        await pool.eventstoreAdapter.getEventSubscribers({
          applicationName: pool.applicationName,
          eventSubscriber: readModelName,
        })
      )[0] ?? { status: null })
      if (status == null || status.status !== 'deliver' || !!status.busy) {
        return
      }

      // This intentionally left as non-atomic operation since custom read model
      // in non-inline-ledger mode should provide idempotent capacities anyway
      await pool.eventstoreAdapter.ensureEventSubscriber({
        applicationName: pool.applicationName,
        eventSubscriber: readModelName,
        status: { ...status, busy: true },
        updateOnly: true,
      })

      const events: Array<any> | null =
        status.cursor != null
          ? (
              await pool.eventstoreAdapter.loadEvents({
                cursor: status.cursor,
                eventTypes: status.eventTypes,
                limit: 100,
              } as any)
            ).events
          : null

      nextCursor = await pool.eventstoreAdapter.getNextCursor(
        status.cursor,
        events != null ? events : []
      )

      if (events == null) {
        try {
          log.verbose(
            `Started applying the "Init" event to the "${readModelName}" read model`
          )

          try {
            const executor = await interop.acquireInitHandler(connection)
            if (executor != null) {
              log.debug(`executing handler`)
              await executor()
              log.debug(`handler executed successfully`)
            }
            lastSuccessEvent = { type: 'Init' }
          } catch (innerError) {
            if (innerError !== STOP_BATCH) {
              log.error(innerError.message)
              log.verbose(innerError.stack)
              lastFailedEvent = innerError
              throw innerError
            }
          }
          log.debug(
            `applying "Init" event to the "${readModelName}"  read model succeed`
          )
        } catch (readModelError) {
          if (readModelError === OMIT_BATCH) {
            throw OMIT_BATCH
          }
          log.error(
            `applying "Init" event to the "${readModelName}" read model failed`
          )
          log.error(readModelError.message)
          log.verbose(readModelError.stack)

          const summaryError = readModelError
          log.verbose(
            `Throwing error for applying "Init" to the "${readModelName}" read model`,
            summaryError
          )
          throw summaryError
        }
      } else if (events.length === 0) {
        return
      } else if (events.length > 0) {
        for (const event of events) {
          if (pool.isDisposed) {
            throw new Error(
              `read model "${readModelName}" updating has been interrupted`
            )
          }
          if (event == null) {
            continue
          }
          const remainingTime = pool.getVacantTimeInMillis()
          log.debug(
            `remaining read model "${readModelName}" feeding time is ${remainingTime} ms`
          )

          if (remainingTime < 0) {
            log.debug(
              `stop applying events to the "${readModelName}" read model due to timeout`
            )
            break
          }

          try {
            log.verbose(
              `Applying "${event.type}" event to the "${readModelName}" read model started`
            )
            try {
              const executor = await interop.acquireEventHandler(
                connection,
                event
              )
              if (executor != null) {
                log.debug(`executing handler`)
                await executor()
                log.debug(`handler executed successfully`)
                lastSuccessEvent = event
              }
            } catch (innerError) {
              if (innerError === STOP_BATCH) {
                break
              } else {
                log.error(innerError.message)
                log.verbose(innerError.stack)
                lastFailedEvent = event
                throw innerError
              }
            }
            log.debug(
              `applying "${event.type}" event to the "${readModelName}" read model succeed`
            )
          } catch (readModelError) {
            if (readModelError === OMIT_BATCH) {
              throw OMIT_BATCH
            }
            log.error(
              `applying "${event.type}" event to the "${readModelName}" read model failed`
            )
            log.error(readModelError.message)
            log.verbose(readModelError.stack)
            const summaryError = new Error()
            summaryError.message = readModelError.message
            summaryError.stack = readModelError.stack

            log.verbose(
              `Throwing error for feeding the "${readModelName}" read model`,
              summaryError
            )
            throw summaryError
          }
        }
      } else {
        throw new Error(
          `Init-based and event-based batches should be segregated`
        )
      }
    } catch (error) {
      if (error === OMIT_BATCH) {
        return
      }

      log.error(error.message)
      log.verbose(error.stack)

      lastError = error
    }

    const isSuccess = lastError == null
    const result = {
      ...status,
      cursor: nextCursor,
      successEvent: lastSuccessEvent,
      failedEvent: lastFailedEvent,
      error:
        lastError != null
          ? {
              name: lastError.name == null ? null : String(lastError.name),
              code: lastError.code == null ? null : String(lastError.code),
              message: String(lastError.message),
              stack: String(lastError.stack),
            }
          : null,
      status: isSuccess ? 'deliver' : 'error',
      busy: false,
    }

    await pool.eventstoreAdapter.ensureEventSubscriber({
      applicationName: pool.applicationName,
      eventSubscriber: readModelName,
      status: result,
      updateOnly: true,
    })

    if (isSuccess) {
      await next(pool, readModelName)
    }
  },

  reset: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {}
  ) =>
    await updateCustomReadModel(
      pool,
      readModelName,
      {
        cursor: null,
        successEvent: null,
        failedEvent: null,
        error: null,
        status: 'deliver',
      },
      async (status: any) => {
        await pool.eventstoreAdapter.ensureEventSubscriber({
          applicationName: pool.applicationName,
          eventSubscriber: readModelName,
          status: {
            ...status,
            status: 'skip',
            busy: false,
          },
          updateOnly: true,
        })

        await pool.connector.drop(connection, readModelName)

        return true
      }
    ),

  resume: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => {
    let isSuccess = false
    await updateCustomReadModel(
      pool,
      readModelName,
      { status: 'deliver', busy: false },
      async (status: any) => {
        isSuccess = status.status === 'deliver' || status.status === 'skip'
        return isSuccess
      }
    )

    if (isSuccess) {
      await next(pool, readModelName)
    }
  },

  pause: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {}
  ) =>
    await updateCustomReadModel(
      pool,
      readModelName,
      { status: 'skip', busy: false },
      async (status: any) => {
        const isSuccess =
          status.status === 'deliver' || status.status === 'skip'
        return isSuccess
      }
    ),

  subscribe: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => {
    const entry = (
      await pool.eventstoreAdapter.getEventSubscribers({
        applicationName: pool.applicationName,
        eventSubscriber: readModelName,
      })
    )[0]
    if (entry == null) {
      return
    }

    await pool.eventstoreAdapter.ensureEventSubscriber({
      applicationName: pool.applicationName,
      eventSubscriber: readModelName,
      status: {
        eventSubscriber: readModelName,
        status: 'skip',
        busy: false,
        ...entry.status,
        ...parameters.subscriptionOptions,
      },
      updateOnly: true,
    })
  },

  resubscribe: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => {
    await pool.eventstoreAdapter.ensureEventSubscriber({
      applicationName: pool.applicationName,
      eventSubscriber: readModelName,
      status: {
        ...parameters.subscriptionOptions,
        eventSubscriber: readModelName,
        status: 'skip',
        busy: false,
      },
      updateOnly: true,
    })

    await pool.connector.drop(connection, readModelName)
  },

  unsubscribe: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => {
    await pool.eventstoreAdapter.ensureEventSubscriber({
      applicationName: pool.applicationName,
      eventSubscriber: readModelName,
      status: null,
      updateOnly: true,
    })

    await pool.connector.drop(connection, readModelName)
  },

  status: async (
    pool: ReadModelPool,
    interop: ReadModelInterop | SagaInterop,
    connection: any,
    readModelName: string,
    parameters: {}
  ) => {
    const { status } = (
      await pool.eventstoreAdapter.getEventSubscribers({
        applicationName: pool.applicationName,
        eventSubscriber: readModelName,
      })
    )[0] ?? { status: null }

    return status
  },
} as const

const doOperation = async (
  operationName: string,
  prepareArguments: Function | null,
  useInlineMethod: boolean,
  pool: ReadModelPool,
  interop: ReadModelInterop | SagaInterop,
  parameters: any
): Promise<any> => {
  const readModelName = interop.name
  if (pool.isDisposed) {
    throw new Error(`the "${readModelName}" read model is disposed`)
  }
  let result = null

  await wrapConnection(
    pool,
    interop,
    async (connection: any): Promise<any> => {
      const originalArgs = [connection, readModelName, parameters]

      const args = useInlineMethod
        ? prepareArguments != null
          ? prepareArguments(pool, interop, ...originalArgs)
          : originalArgs
        : [pool, interop, ...originalArgs]

      try {
        if (useInlineMethod) {
          result = await pool.connector[operationName](...args)
        } else {
          result = await (customReadModelMethods as any)[operationName](...args)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          'Read-model operations error:',
          operationName,
          readModelName,
          error
        )
        throw error
      }
    }
  )

  return result
}

const operationMethods = {
  build: doOperation.bind(
    null,
    'build',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
      connection: any,
      readModelName: string,
      parameters: {}
    ) => [
      connection,
      readModelName,
      connection,
      interop,
      next.bind(null, pool, readModelName),
      pool.eventstoreAdapter,
      pool.getVacantTimeInMillis,
    ]
  ),

  reset: doOperation.bind(
    null,
    'reset',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
      connection: any,
      readModelName: string,
      parameters: {}
    ) => [connection, readModelName, next.bind(null, pool, readModelName)]
  ),

  resume: doOperation.bind(
    null,
    'resume',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
      connection: any,
      readModelName: string,
      parameters: {}
    ) => [connection, readModelName, next.bind(null, pool, readModelName)]
  ),

  pause: doOperation.bind(
    null,
    'pause',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
      connection: any,
      readModelName: string,
      parameters: {}
    ) => [connection, readModelName]
  ),

  subscribe: doOperation.bind(
    null,
    'subscribe',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
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
  ),

  resubscribe: doOperation.bind(
    null,
    'resubscribe',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
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
  ),

  unsubscribe: doOperation.bind(
    null,
    'unsubscribe',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
      connection: any,
      readModelName: string,
      parameters: {}
    ) => [connection, readModelName]
  ),

  status: doOperation.bind(
    null,
    'status',
    (
      pool: ReadModelPool,
      interop: ReadModelInterop | SagaInterop,
      connection: any,
      readModelName: string,
      parameters: {}
    ) => [connection, readModelName]
  ),
} as const

export const checkAllMethodsExist = <T extends object>(
  obj: T,
  keys: Array<keyof T>
): boolean =>
  keys.reduce<boolean>(
    (acc, key) => acc && typeof obj[key] === 'function',
    true
  )

export const checkConnectorMethod = (connector: any): boolean | null =>
  checkAllMethodsExist(connector, ['connect', 'disconnect', 'dispose'])
    ? checkAllMethodsExist(connector, Object.keys(operationMethods))
      ? true
      : checkAllMethodsExist(connector, ['drop'])
      ? false
      : null
    : null

const dispose = async (
  pool: ReadModelPool,
  interop: ReadModelInterop | SagaInterop
): Promise<void> => {
  const readModelName = interop.name
  if (pool.isDisposed) {
    throw new Error(`read model "${readModelName}" is disposed`)
  }
  pool.isDisposed = true

  const promises = []
  for (const connection of pool.connections) {
    promises.push(pool.connector.disconnect(connection, readModelName))
  }
  await Promise.all(promises)
}

const wrapReadModel = ({
  applicationName,
  interop,
  readModelConnectors,
  invokeEventSubscriberAsync,
  performanceTracer,
  getVacantTimeInMillis,
  monitoring,
  eventstoreAdapter,
}: WrapReadModelOptions) => {
  const log = getLog(`readModel:wrapReadModel:${interop.name}`)

  log.debug(`wrapping read-model`)
  const connector = readModelConnectors[interop.connectorName]
  if (connector == null) {
    throw new Error(
      `connector "${interop.connectorName}" for read model "${interop.name}" does not exist`
    )
  }

  const safeMonitoring =
    monitoring != null ? makeMonitoringSafe(monitoring) : monitoring

  const pool: ReadModelPool = {
    invokeEventSubscriberAsync,
    applicationName,
    connections: new Set(),
    connector,
    isDisposed: false,
    performanceTracer,
    getVacantTimeInMillis,
    monitoring: safeMonitoring,
    eventstoreAdapter,
  }

  const api = {
    serializeState,
    read: read.bind(null, pool, interop),
    dispose: dispose.bind(null, pool, interop),

    deleteProperty: async (parameters: { key: string }) => {
      const entry = (
        await pool.eventstoreAdapter.getEventSubscribers({
          applicationName: pool.applicationName,
          eventSubscriber: interop.name,
        })
      )[0]
      if (entry == null) {
        return
      }
      const status = entry.status ?? {}
      const { [parameters.key]: _, ...currentProperties } =
        status.properties ?? {}
      await pool.eventstoreAdapter.ensureEventSubscriber({
        applicationName: pool.applicationName,
        eventSubscriber: interop.name,
        status: {
          ...status,
          properties: currentProperties,
        },
        updateOnly: true,
      })
    },

    getProperty: async (parameters: { key: string }) => {
      const { status } = (
        await pool.eventstoreAdapter.getEventSubscribers({
          applicationName: pool.applicationName,
          eventSubscriber: interop.name,
        })
      )[0] ?? { status: null }

      return (status?.properties ?? {})[parameters.key]
    },

    listProperties: async (parameters: {}) => {
      const { status } = (
        await pool.eventstoreAdapter.getEventSubscribers({
          applicationName: pool.applicationName,
          eventSubscriber: interop.name,
        })
      )[0] ?? { status: null }

      return status?.properties ?? {}
    },

    setProperty: async (parameters: { key: string; value: any }) => {
      const entry = (
        await pool.eventstoreAdapter.getEventSubscribers({
          applicationName: pool.applicationName,
          eventSubscriber: interop.name,
        })
      )[0]
      if (entry == null) {
        return
      }
      const status = entry.status ?? {}
      const { ...currentProperties } = status.properties ?? {}
      await pool.eventstoreAdapter.ensureEventSubscriber({
        applicationName: pool.applicationName,
        eventSubscriber: interop.name,
        status: {
          ...status,
          properties: {
            ...currentProperties,
            [parameters.key]: parameters.value,
          },
        },
        updateOnly: true,
      })
    },
  }

  log.debug(`detecting connector features`)

  const isFullMethodsAdapter = checkConnectorMethod(connector)
  if (isFullMethodsAdapter == null) {
    throw new Error(`Invalid adapter ${interop.connectorName}`)
  }

  Object.assign(
    api,
    (Object.keys(operationMethods) as Array<
      keyof typeof operationMethods
    >).reduce(
      (acc, key) => ({
        ...acc,
        [key]: operationMethods[key].bind(
          null,
          isFullMethodsAdapter,
          pool,
          interop
        ),
      }),
      {}
    )
  )

  log.debug(`read model wrapped successfully`)

  return Object.freeze(api)
}

export default wrapReadModel
