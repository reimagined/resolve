import {
  EventHandlerEncryptionFactory,
  initDomain,
  Monitoring,
  SecretsManager,
  MonitoringPart,
} from '@resolve-js/core'
import { createQuery } from '@resolve-js/runtime'
import {
  TestReadModel,
  QueryTestResult,
  TestEvent,
  TestQuery,
  TestQueryAssertion,
} from '../../types'
import { getSecretsManager } from '../../runtime/get-secrets-manager'
import { getEventStore } from '../../runtime/get-event-store'
import { getReadModelAdapter } from '../../runtime/get-read-model-adapter'
import { defaultAssertion } from '../../utils/assertions'

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
    })

    const liveErrors: Array<Error> = []
    const monitoring: Monitoring = {
      error: async (error: Error, part: MonitoringPart) => {
        if (part === 'readModelProjection') {
          liveErrors.push(error)
        }
      },
    }
    const eventstoreAdapter = getEventStore(events)

    const errors = []
    let executor = null
    let result: QueryTestResult | null = null
    const actualAssertion = assertion != null ? assertion : defaultAssertion

    try {
      executor = createQuery({
        applicationName: 'APP_NAME',
        readModelConnectors: {
          ADAPTER_NAME: actualAdapter,
        },
        getVacantTimeInMillis: () => 0x7fffffff,
        invokeEventSubscriberAsync: async () => void 0,
        eventstoreAdapter,
        readModelsInterop: domain.readModelDomain.acquireReadModelsInterop({
          secretsManager,
          monitoring,
        }),
        viewModelsInterop: {},
        performanceTracer: null,
      })

      try {
        await eventstoreAdapter.ensureEventSubscriber({
          applicationName: 'APP_NAME',
          eventSubscriber: readModel.name,
          status: null,
          destination: 'LOCAL',
        })

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

        await executor.build({
          modelName: readModel.name,
        })

        await executor.build({
          modelName: readModel.name,
        })

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
          resolverArgs: query.args,
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

      try {
        await eventstoreAdapter.removeEventSubscriber({
          applicationName: 'APP_NAME',
          eventSubscriber: readModel.name,
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
