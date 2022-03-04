import partial from 'lodash.partial'
import { initDomain } from '@resolve-js/core'
import {
  createQueryExecutor,
  eventSubscriberFactory,
} from '@resolve-js/runtime-base'

import { getSecretsManager } from '../../runtime/get-secrets-manager'
import { getEventStore } from '../../runtime/get-event-store'
import { getSagaRuntime } from '../../runtime/get-saga-runtime'
import { mockSideEffects } from '../../runtime/mock-side-effects'
import { getReadModelAdapter } from '../../runtime/get-read-model-adapter'
import { defaultAssertion } from '../../utils/assertions'
import {
  getCommandImplementationKey,
  getQueryImplementationKey,
} from '../../runtime/utils'

import type {
  TestSaga,
  SagaTestResult,
  TestEvent,
  TestSagaAssertion,
  MockedCommandImplementation,
  MockedQueryImplementation,
} from '../../types'
import type {
  EventHandlerEncryptionFactory,
  Monitoring,
  SecretsManager,
} from '@resolve-js/core'

type SagaTestContext = {
  saga: TestSaga
  events: TestEvent[]
  adapter?: any
  encryption?: EventHandlerEncryptionFactory
}
type TestCompleteCallback = (result: SagaTestResult) => void
type TestFailureCallback = (error: Error) => void

export type SagaTestEnvironment = {
  promise: Promise<SagaTestResult>
  setSecretsManager: (manager: SecretsManager) => void
  allowSideEffects: () => void
  setSideEffectsStartTimestamp: (value: number) => void
  addAssertion: (assertion: TestSagaAssertion) => void
  isExecuted: () => boolean
  mockCommandImplementation: (
    aggregateName: string,
    type: string,
    implementation: MockedCommandImplementation
  ) => void
  mockQueryImplementation: (
    modelName: string,
    resolverName: string,
    implementation: MockedQueryImplementation
  ) => void
}

type PromisedAssertion = (
  result: SagaTestResult,
  error: Error | null
) => Promise<SagaTestResult>

const promisedAssertion = (
  assertion: TestSagaAssertion,
  result: SagaTestResult,
  error: Error | null
): Promise<SagaTestResult> => {
  return new Promise<SagaTestResult>((resolve, reject) =>
    assertion(resolve, reject, result, error, false)
  )
}

export const makeTestEnvironment = (
  context: SagaTestContext
): SagaTestEnvironment => {
  const mockedCommandImplementations = new Map<
    string,
    MockedCommandImplementation
  >()
  const mockedQueryImplementations = new Map<
    string,
    MockedQueryImplementation
  >()

  let executed = false
  let useRealSideEffects = false
  let sideEffectsStartTimestamp = 0
  let assertions: PromisedAssertion[] = []
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
  const addAssertion = (value: TestSagaAssertion) => {
    assertions.push(partial(promisedAssertion, value))
  }
  const isExecuted = () => executed
  const mockCommandImplementation = (
    aggregateName: string,
    type: string,
    implementation: MockedCommandImplementation
  ) => {
    mockedCommandImplementations.set(
      getCommandImplementationKey({ type, aggregateName }),
      implementation
    )
  }
  const mockQueryImplementation = (
    modelName: string,
    resolverName: string,
    implementation: MockedQueryImplementation
  ) => {
    mockedQueryImplementations.set(
      getQueryImplementationKey({ modelName, resolverName }),
      implementation
    )
  }

  const promise = new Promise<SagaTestResult>((resolve, reject) => {
    completeTest = resolve
    failTest = reject
  })

  const execute = async () => {
    executed = true

    const result: SagaTestResult = {
      commands: [],
      scheduledCommands: [],
      queries: [],
      sideEffects: [],
    }

    const { saga, events, adapter, encryption } = context

    const actualEncryption = encryption != null ? encryption : async () => null
    const actualAdapter =
      adapter != null ? adapter : await getReadModelAdapter()
    let isNext = false

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
      apiHandlers: [],
    })

    const liveErrors: Array<Error> = []
    const monitoring: Monitoring = {
      group: (config: Record<string, string>) => {
        if (config.Part !== 'ReadModelProjection') {
          return monitoring
        }

        return {
          ...monitoring,
          error: (error: Error) => {
            liveErrors.push(error)
          },
          execution: (error?: Error) => {
            if (error != null) {
              liveErrors.push(error)
            }
          },
        }
      },
      time: () => void 0,
      timeEnd: () => void 0,
      error: () => void 0,
      execution: () => void 0,
      publish: async () => void 0,
      duration: () => void 0,
      custom: () => void 0,
      rate: () => void 0,
      getMetrics: () => ({ metrics: [] }),
      clearMetrics: () => void 0,
    }

    const errors: Error[] = []
    let eventSubscriber = null
    let executor = null

    try {
      const eventstoreAdapter = await getEventStore(events)

      const runtime = getSagaRuntime(
        result,
        {
          commands: mockedCommandImplementations,
          queries: mockedQueryImplementations,
        },
        domain.sagaDomain.schedulerName,
        secretsManager,
        monitoring,
        sideEffectsStartTimestamp
      )

      eventSubscriber = eventSubscriberFactory({
        getEventSubscriberDestination: () => 'LOCAL',
        applicationName: 'APP_NAME',
        readModelConnectors: {
          ADAPTER_NAME: actualAdapter,
        },
        getVacantTimeInMillis: () => 0x7fffffff,
        eventstoreAdapter,
        readModelsInterop: {},
        performanceTracer: null,
        loadReadModelProcedure: () => Promise.resolve(null),
        sagasInterop: domain.sagaDomain.acquireSagasInterop(runtime),
        monitoring: null,
      })

      executor = createQueryExecutor({
        readModelConnectors: {
          ADAPTER_NAME: actualAdapter,
        },
        readModelsInterop: domain.sagaDomain.acquireSagasInterop(runtime),
        viewModelsInterop: {},
        performanceTracer: null,
        monitoring: null,
        eventSubscriber,
      })

      try {
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

        do {
          isNext = false
          // TODO ???
          const res = await executor.build({
            modelName: saga.name,
          } as any)
          if (res.payload.continue) {
            isNext = true
          }
        } while (isNext)

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
    } catch (error) {
      errors.push(error)
    }

    if (errors.length === 0) {
      if (assertions.length > 0) {
        try {
          await Promise.all(
            assertions.map((assertion) => assertion(result, null))
          )
          completeTest(result)
        } catch (e) {
          failTest(e)
        }
      } else {
        defaultAssertion(completeTest, failTest, result, null)
      }
    } else {
      let summaryError = errors[0]
      if (errors.length > 1) {
        summaryError = new Error(errors.map((err) => err.message).join('\n'))
        summaryError.stack = errors.map((err) => err.stack).join('\n')
      }
      // eslint-disable-next-line no-console
      console.error(summaryError)

      if (assertions.length > 0) {
        try {
          await Promise.all(
            assertions.map((assertion) => assertion(result, errors[0]))
          )
          failTest(errors[0])
        } catch (e) {
          failTest(e)
        }
      } else {
        defaultAssertion(completeTest, failTest, result, errors[0])
      }
    }
  }

  setImmediate(execute)

  return {
    setSecretsManager,
    allowSideEffects,
    setSideEffectsStartTimestamp,
    addAssertion,
    isExecuted,
    promise,
    mockCommandImplementation,
    mockQueryImplementation,
  }
}
