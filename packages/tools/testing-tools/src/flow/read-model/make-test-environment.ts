import { initDomain } from '@resolve-js/core'
import {
  createQueryExecutor,
  eventSubscriberFactory,
} from '@resolve-js/runtime-base'

import { getSecretsManager } from '../../runtime/get-secrets-manager'
import { getEventStore } from '../../runtime/get-event-store'
import { getReadModelAdapter } from '../../runtime/get-read-model-adapter'
import { defaultAssertion } from '../../utils/assertions'

import type {
  EventHandlerEncryptionFactory,
  Monitoring,
  SecretsManager,
} from '@resolve-js/core'
import type {
  TestReadModel,
  QueryTestResult,
  TestEvent,
  TestQuery,
  TestQueryAssertion,
} from '../../types'

type ReadModelTestContext = {
  readModel: TestReadModel
  events: TestEvent[]
  query: TestQuery
  adapter?: any
  encryption?: EventHandlerEncryptionFactory
}
type TestCompleteCallback = (result: QueryTestResult) => void
type TestFailureCallback = (error: Error) => void

export type ReadModelTestEnvironment = {
  promise: Promise<QueryTestResult>
  setAuthToken: (token: string) => void
  setSecretsManager: (manager: SecretsManager) => void
  setAssertion: (assertion: TestQueryAssertion) => void
  getAssertion: () => TestQueryAssertion
  negateAssertion: () => void
  isAssertionNegated: () => boolean
  isExecuted: () => boolean
}

export const makeTestEnvironment = (
  context: ReadModelTestContext
): ReadModelTestEnvironment => {
  let executed = false
  let authToken: string
  let assertion: TestQueryAssertion
  let assertionNegated = false
  let secretsManager: SecretsManager = getSecretsManager()
  let completeTest: TestCompleteCallback
  let failTest: TestFailureCallback

  const setAuthToken = (value: string) => {
    authToken = value
  }
  const setSecretsManager = (value: SecretsManager) => {
    secretsManager = value
  }
  const setAssertion = (value: TestQueryAssertion) => {
    assertion = value
  }
  const getAssertion = () => {
    return assertion
  }
  const negateAssertion = () => {
    assertionNegated = true
  }
  const isAssertionNegated = () => assertionNegated
  const isExecuted = () => executed
  const promise = new Promise<QueryTestResult>((resolve, reject) => {
    completeTest = resolve
    failTest = reject
  })

  const execute = async () => {
    executed = true

    const { readModel, events, query, adapter, encryption } = context
    const actualAdapter =
      adapter != null ? adapter : await getReadModelAdapter()
    const actualEncryption = encryption != null ? encryption : async () => null

    const domain = initDomain({
      viewModels: [],
      readModels: [
        {
          name: readModel.name,
          projection: readModel.projection,
          resolvers: readModel.resolvers,
          connectorName: 'ADAPTER_NAME',
          encryption: actualEncryption,
        },
      ],
      aggregates: [],
      sagas: [],
      apiHandlers: [],
    })

    const liveErrors: Array<Error> = []

    const makeMonitoring = (
      error: Monitoring['error'] = () => void 0,
      execution: Monitoring['execution'] = () => void 0
    ): Monitoring => {
      return {
        group: (config) => {
          const errorHandler = (error?: Error) => {
            if (error != null) {
              liveErrors.push(error)
            }
          }

          return config.Part === 'ReadModelProjection'
            ? makeMonitoring(errorHandler, errorHandler)
            : makeMonitoring(error, execution)
        },
        time: () => void 0,
        timeEnd: () => void 0,
        execution,
        error,
        publish: async () => void 0,
        duration: () => void 0,
        custom: () => void 0,
        getMetrics: () => ({ metrics: [] }),
        clearMetrics: () => void 0,
        rate: () => void 0,
      }
    }

    const errors = []
    let eventSubscriber = null
    let executor = null
    let result: QueryTestResult | null = null
    const actualAssertion = assertion != null ? assertion : defaultAssertion
    let isNext = false

    try {
      const eventstoreAdapter = await getEventStore(events)
      eventSubscriber = eventSubscriberFactory({
        getEventSubscriberDestination: () => 'LOCAL',
        applicationName: 'APP_NAME',
        readModelConnectors: {
          ADAPTER_NAME: actualAdapter,
        },
        getVacantTimeInMillis: () => 0x7fffffff,
        eventstoreAdapter,
        readModelsInterop: domain.readModelDomain.acquireReadModelsInterop({
          secretsManager,
          monitoring: makeMonitoring(),
        }),
        performanceTracer: null,
        loadReadModelProcedure: () => Promise.resolve(null),
        setCurrentEventSubscriber: () => void 0,
        sagasInterop: {},
        monitoring: null,
      })

      executor = createQueryExecutor({
        readModelConnectors: {
          ADAPTER_NAME: actualAdapter,
        },
        readModelsInterop: domain.readModelDomain.acquireReadModelsInterop({
          secretsManager,
          monitoring: makeMonitoring(),
        }),
        viewModelsInterop: {},
        performanceTracer: null,
        monitoring: null,
        eventSubscriber,
      })

      try {
        await executor.subscribe({
          modelName: readModel.name,
          subscriptionOptions: {
            eventTypes: null,
            aggregateIds: null,
          },
        })

        await executor.resume({
          modelName: readModel.name,
        })

        do {
          isNext = false
          // TODO ???
          const res = await executor.build({
            modelName: readModel.name,
          } as any)
          if (res.payload.continue) {
            isNext = true
          }
        } while (isNext)

        const status = await executor.status({
          modelName: readModel.name,
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
        void ({ data: result } = await executor.read({
          modelName: readModel.name,
          resolverName: query.resolver,
          resolverArgs: query.args ?? {},
          jwt: authToken,
        }))
      } catch (err) {
        errors.push(err)
      }

      try {
        await executor.unsubscribe({
          modelName: readModel.name,
        })
      } catch (err) {
        errors.push(err)
      }
    } catch (error) {
      errors.push(error)
    }

    if (errors.length === 0) {
      return actualAssertion(
        completeTest,
        failTest,
        result,
        null,
        assertionNegated
      )
    } else {
      let summaryError = errors[0]
      if (errors.length > 1) {
        summaryError = new Error(errors.map((err) => err.message).join('\n'))
        summaryError.stack = errors.map((err) => err.stack).join('\n')
      }
      // eslint-disable-next-line no-console
      console.error(summaryError)

      return actualAssertion(
        completeTest,
        failTest,
        null,
        errors[0],
        assertionNegated
      )
    }
  }

  setImmediate(execute)

  return {
    setAuthToken,
    setSecretsManager,
    setAssertion,
    getAssertion,
    negateAssertion,
    isAssertionNegated,
    isExecuted,
    promise,
  }
}
