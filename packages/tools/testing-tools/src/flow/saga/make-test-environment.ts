import {
  EventHandlerEncryptionFactory,
  initDomain,
  Monitoring,
  SecretsManager,
} from '@resolve-js/core'
import { createQuery } from '@resolve-js/runtime'
import {
  TestSaga,
  QueryTestResult,
  SagaTestResult,
  TestEvent,
} from '../../types'
import { getSecretsManager } from '../../runtime/get-secrets-manager'
import { getEventStore } from '../../runtime/get-event-store'
import { getSagaRuntime } from '../../runtime/get-saga-runtime'
import { mockSideEffects } from '../../runtime/mock-side-effects'
import { getReadModelAdapter } from '../../runtime/get-read-model-adapter'

type SagaTestContext = {
  saga: TestSaga
  events: TestEvent[]
  adapter?: any
  encryption?: EventHandlerEncryptionFactory
}
type TestCompleteCallback = (result: QueryTestResult) => void
type TestFailureCallback = (error: Error) => void

export type SagaTestEnvironment = {
  promise: Promise<SagaTestResult>
  setSecretsManager: (manager: SecretsManager) => void
  allowSideEffects: () => void
  setSideEffectsStartTimestamp: (value: number) => void
  isExecuted: () => boolean
}

export const makeTestEnvironment = (
  context: SagaTestContext
): SagaTestEnvironment => {
  let executed = false
  let useRealSideEffects = false
  let sideEffectsStartTimestamp = 0
  let secretsManager: SecretsManager = getSecretsManager()
  let completeTest: TestCompleteCallback
  let failTest: TestFailureCallback

  const setSecretsManager = (value: SecretsManager) => {
    secretsManager = value
  }
  const allowSideEffects = () => {
    useRealSideEffects = true
  }
  const setSideEffectsStartTimestamp = (value: number) => {
    sideEffectsStartTimestamp = value
  }
  const isExecuted = () => executed
  const promise = new Promise<QueryTestResult>((resolve, reject) => {
    completeTest = resolve
    failTest = reject
  })

  const execute = async () => {
    executed = true

    const result: SagaTestResult = Object.defineProperty(
      {
        commands: [],
        scheduledCommands: [],
        queries: [],
        sideEffects: [],
      },
      // FIXME: deprecated
      'scheduleCommands',
      {
        enumerable: false,
        get() {
          // eslint-disable-next-line no-console
          console.warn(
            `'scheduleCommands' property deprecated, use 'scheduledCommands' instead.`
          )
          return this.scheduledCommands
        },
      }
    )

    const { saga, events, adapter, encryption } = context

    const actualEncryption = encryption != null ? encryption : async () => null
    const actualAdapter =
      adapter != null ? adapter : await getReadModelAdapter()

    const domain = initDomain({
      viewModels: [],
      readModels: [],
      aggregates: [],
      sagas: [
        {
          name: saga.name,
          handlers: saga.handlers,
          sideEffects: useRealSideEffects
            ? saga.sideEffects
            : mockSideEffects(result, saga.sideEffects),
          connectorName: 'ADAPTER_NAME',
          encryption: actualEncryption,
        },
      ],
    })

    const liveErrors: Array<Error> = []
    const monitoring: Monitoring = {
      error: async (error: Error, part: string) => {
        if (part === 'readModelProjection') {
          liveErrors.push(error)
        }
      },
    }
    const eventstoreAdapter = getEventStore(events)

    const errors = []
    let executor = null

    try {
      const runtime = getSagaRuntime(
        result,
        domain.sagaDomain.schedulerName,
        secretsManager,
        monitoring,
        sideEffectsStartTimestamp
      )

      executor = createQuery({
        applicationName: 'APP_NAME',
        readModelConnectors: {
          ADAPTER_NAME: actualAdapter,
        },
        getVacantTimeInMillis: () => 0x7fffffff,
        invokeEventSubscriberAsync: async () => void 0,
        eventstoreAdapter,
        readModelsInterop: domain.sagaDomain.acquireSagasInterop(runtime),
        viewModelsInterop: {},
        performanceTracer: null,
      })

      try {
        await eventstoreAdapter.ensureEventSubscriber({
          applicationName: 'APP_NAME',
          eventSubscriber: saga.name,
          status: null,
          destination: 'LOCAL',
        })

        await executor.subscribe({
          modelName: saga.name,
          subscriptionOptions: {
            eventTypes: null,
            aggregateIds: null,
          },
        })

        await executor.resume({
          modelName: saga.name,
        })

        await executor.build({
          modelName: saga.name,
        })

        await executor.build({
          modelName: saga.name,
        })

        const status = await executor.status({
          modelName: saga.name,
        })
        if (status.status === 'error') {
          if (!Array.isArray(status.errors)) {
            throw new Error('Unknown error')
          }
          const liveErrorIndex =
            status.errors.length === 1
              ? liveErrors.findIndex(
                  (err) => err.message === status.errors[0].message
                )
              : -1
          if (liveErrorIndex < 0) {
            const error = new Error(
              status.errors.map((err: any) => err.message).join('\n')
            )
            error.stack = status.errors.map((err: any) => err.stack).join('\n')
            throw error
          } else {
            throw liveErrors[liveErrorIndex]
          }
        }
      } catch (err) {
        errors.push(err)
      }

      try {
        await executor.unsubscribe({
          modelName: saga.name,
        })
      } catch (err) {
        errors.push(err)
      }

      try {
        await eventstoreAdapter.removeEventSubscriber({
          applicationName: 'APP_NAME',
          eventSubscriber: saga.name,
        })
      } catch (err) {
        errors.push(err)
      }
    } catch (error) {
      errors.push(error)
    } finally {
      if (executor != null) {
        try {
          await executor.dispose()
        } catch (err) {
          errors.push(err)
        }
      }
    }

    if (errors.length === 0) {
      completeTest(result)
    } else {
      let summaryError = errors[0]
      if (errors.length > 1) {
        summaryError = new Error(errors.map((err) => err.message).join('\n'))
        summaryError.stack = errors.map((err) => err.stack).join('\n')
      }
      // eslint-disable-next-line no-console
      console.error(summaryError)

      failTest(errors[0])
    }
  }

  setImmediate(execute)

  return {
    setSecretsManager,
    allowSideEffects,
    setSideEffectsStartTimestamp,
    isExecuted,
    promise,
  }
}
