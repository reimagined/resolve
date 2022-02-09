import { Eventstore, ReadModelInterop, SagaInterop } from "@resolve-js/core"
import logScope from '@resolve-js/debug-levels'

import { BuildDirectContinuation, CustomReadModelConnection } from './types'
const getLog = (scope: string) => logScope(`resolve:runtime:query:${scope}`)

const updateCustomReadModel = async (
  eventstoreAdapter: Eventstore,
  applicationName: string,
  eventSubscriber: string,
  nextStatus: any,
  condition?: Function
) => {
  const { status } = (
    await eventstoreAdapter.getEventSubscribers({
      applicationName,
      eventSubscriber,
    })
  )[0] ?? { status: null }

  if (
    status == null ||
    (typeof condition === 'function' && !(await condition(status)))
  ) {
    return
  }

  await eventstoreAdapter.ensureEventSubscriber({
    applicationName,
    eventSubscriber,
    status: {
      ...status,
      ...nextStatus,
    },
    updateOnly: true,
  })
}

export const OMIT_BATCH = Symbol('OMIT_BATCH')
export const STOP_BATCH = Symbol('STOP_BATCH')

export const customReadModelMethods = {
  build: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    interop: ReadModelInterop | SagaInterop,
    connection: CustomReadModelConnection,
    eventSubscriber: string,
    getVacantTimeInMillis: Function,
    parameters: {}
  ) => {
    const log = getLog(`build:${eventSubscriber}`)
    let lastSuccessEvent = null
    let lastFailedEvent = null
    let lastError: any = null
    let nextCursor: any = null
    let status: any = null
    try {
      log.debug(`applying events to read-model "${eventSubscriber}" started`)
      void ({ status } = (
        await eventstoreAdapter.getEventSubscribers({
          applicationName,
          eventSubscriber,
        })
      )[0] ?? { status: null })
      if (status == null || status.status !== 'deliver' || !!status.busy) {
        return
      }

      // This intentionally left as non-atomic operation since custom read model
      // in non-inline-ledger mode should provide idempotent capacities anyway
      await eventstoreAdapter.ensureEventSubscriber({
        applicationName,
        eventSubscriber,
        status: { ...status, busy: true },
        updateOnly: true,
      })

      const events: Array<any> | null =
        status.cursor != null
          ? (
              await eventstoreAdapter.loadEvents({
                cursor: status.cursor,
                eventTypes: status.eventTypes,
                limit: 100,
              } as any)
            ).events
          : null

      nextCursor = await eventstoreAdapter.getNextCursor(
        status.cursor,
        events != null ? events : []
      )

      if (events == null) {
        try {
          log.debug(
            `Started applying the "Init" event to the "${eventSubscriber}" read model`
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
            `applying "Init" event to the "${eventSubscriber}"  read model succeed`
          )
        } catch (readModelError) {
          if (readModelError === OMIT_BATCH) {
            throw OMIT_BATCH
          }
          log.error(
            `applying "Init" event to the "${eventSubscriber}" read model failed`
          )
          log.error(readModelError.message)
          log.verbose(readModelError.stack)

          const summaryError = readModelError
          log.verbose(
            `Throwing error for applying "Init" to the "${eventSubscriber}" read model`,
            summaryError
          )
          throw summaryError
        }
      } else if (events.length === 0) {
        return
      } else if (events.length > 0) {
        for (const event of events) {
          if (event == null) {
            continue
          }
          const remainingTime = getVacantTimeInMillis()
          log.debug(
            `remaining read model "${eventSubscriber}" feeding time is ${remainingTime} ms`
          )

          if (remainingTime < 0) {
            log.debug(
              `stop applying events to the "${eventSubscriber}" read model due to timeout`
            )
            break
          }

          try {
            log.verbose(
              `Applying "${event.type}" event to the "${eventSubscriber}" read model started`
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
              `applying "${event.type}" event to the "${eventSubscriber}" read model succeed`
            )
          } catch (readModelError) {
            if (readModelError === OMIT_BATCH) {
              throw OMIT_BATCH
            }
            log.error(
              `applying "${event.type}" event to the "${eventSubscriber}" read model failed`
            )
            log.error(readModelError.message)
            log.verbose(readModelError.stack)
            const summaryError = new Error()
            summaryError.message = readModelError.message
            summaryError.stack = readModelError.stack

            log.verbose(
              `Throwing error for feeding the "${eventSubscriber}" read model`,
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
    const buildResult = {
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

    await eventstoreAdapter.ensureEventSubscriber({
      applicationName,
      eventSubscriber,
      status: buildResult,
      updateOnly: true,
    })

    const result: BuildDirectContinuation = isSuccess ? {
      type: 'build-direct-invoke',
      payload: {}
    } : null

    return result
  },

  reset: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    interop: ReadModelInterop | SagaInterop,
    connection: CustomReadModelConnection,
    eventSubscriber: string,
    dropCustomReadModel: Function,
    parameters: {}
  ) =>
    await updateCustomReadModel(
      eventstoreAdapter,
      applicationName,
      eventSubscriber,
      {
        cursor: null,
        successEvent: null,
        failedEvent: null,
        error: null,
        status: 'deliver',
      },
      async (status: any) => {
        await eventstoreAdapter.ensureEventSubscriber({
          applicationName,
          eventSubscriber,
          status: {
            ...status,
            status: 'skip',
            busy: false,
          },
          updateOnly: true,
        })

        await dropCustomReadModel()

        return true
      }
    ),

  resume: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    interop: ReadModelInterop | SagaInterop,
    connection: CustomReadModelConnection,
    eventSubscriber: string,
    parameters: {}
  ) => {
    let isSuccess = false
    await updateCustomReadModel(
      eventstoreAdapter,
      applicationName,
      eventSubscriber,
      { status: 'deliver', busy: false },
      async (status: any) => {
        isSuccess = status.status === 'deliver' || status.status === 'skip'
        return isSuccess
      }
    )

    const result: BuildDirectContinuation = isSuccess ? {
      type: 'build-direct-invoke',
      payload: {}
    } : null

    return result
  },

  pause: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    interop: ReadModelInterop | SagaInterop,
    connection: CustomReadModelConnection,
    eventSubscriber: string,
    parameters: {}
  ) =>
    await updateCustomReadModel(
      eventstoreAdapter,
      applicationName,
      eventSubscriber,
      { status: 'skip', busy: false },
      async (status: any) => {
        const isSuccess =
          status.status === 'deliver' || status.status === 'skip'
        return isSuccess
      }
    ),

  status: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    interop: ReadModelInterop | SagaInterop,
    connection: CustomReadModelConnection,
    eventSubscriber: string,
    parameters: {}
  ) => {
    const { status } = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0] ?? { status: null }

    return status
  },
} as const



