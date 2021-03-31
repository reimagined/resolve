import { initDomain } from '@resolve-js/core'
import { createCommand } from '@resolve-js/runtime'
import {
  AggregateTestResult,
  BDDAggregate,
  BDDAggregateAssertion,
  TestEvent,
} from '../../types'
import { prepareEvents } from '../../utils/prepare-events'

type AggregateTestContext = {
  aggregate: BDDAggregate
}
type TestCompleteCallback = (result: AggregateTestResult) => void

export type AggregateTestEnvironment = {
  promise: Promise<AggregateTestResult>
  setAuthToken: (token: string) => void
  setAssertion: (assertion: BDDAggregateAssertion) => void
  getAssertion: () => BDDAggregateAssertion
  isExecuted: () => boolean
}

const makeDummyEventStoreAdapter = (
  events: TestEvent[],
  aggregateId: string
) => {
  const savedEvents: Event[] = []

  return {
    getNextCursor: async () => Promise.resolve(null),
    saveSnapshot: async () => Promise.resolve(),
    loadSnapshot: async () => Promise.resolve(null),
    saveEvent: async (event: Event) => {
      savedEvents.push(event)
    },
    loadEvents: async () =>
      Promise.resolve({
        events: prepareEvents(events, 'aggregate', { aggregateId }),
      }),
    ensureEventSubscriber: async () => Promise.resolve(),
    removeEventSubscriber: async () => Promise.resolve(),
    getEventSubscribers: async () => Promise.resolve([]),
  }
}

export const makeTestEnvironment = (
  context: AggregateTestContext
): AggregateTestEnvironment => {
  let executed = false
  let authToken: string
  let assertion: BDDAggregateAssertion
  let completeTest: (result: AggregateTestResult) => void

  const setAuthToken = (value: string) => {
    authToken = value
  }
  const setAssertion = (value: BDDAggregateAssertion) => {
    assertion = value
  }
  const getAssertion = () => {
    return assertion
  }
  const isExecuted = () => executed
  const promise = new Promise<AggregateTestResult>((resolve) => {
    completeTest = resolve
  })

  const execute = async () => {
    executed = true

    completeTest({ type: 'ok' })

    const { aggregate } = context

    const domain = initDomain({
      viewModels: [],
      readModels: [],
      aggregates: [
        {
          name: aggregate.name,
          projection: aggregate.projection,
          commands: aggregate.commands,
          encryption: aggregate.encryption || null,
          deserializeState: JSON.parse,
          serializeState: JSON.stringify,
          invariantHash: 'invariant-hash',
        },
      ],
      sagas: [],
    })

    /*
    const { assertion } = context
    let executor: CommandExecutor | null = null
    try {
      executor = createCommand({
        performanceTracer: null,
        aggregatesInterop: domain.aggregateDomain.acquireAggregatesInterop({
          eventstore: makeDummyEventStoreAdapter(state),
          secretsManager: state.secretsManager,
          monitoring: {},
          hooks: {},
        }),
      })

      const result = await executor({
        aggregateId: state.aggregateId,
        aggregateName: state.aggregate.name,
        type: state.command.name,
        payload: state.command.payload || {},
        jwt: state.jwt,
      })

      const event: {
        type: string
        payload?: SerializableMap
      } = {
        type: result.type,
      }

      if (Object.prototype.hasOwnProperty.call(result, 'payload')) {
        event['payload'] = result['payload']
      }

      return assertion(resolve, reject, event, null)
    } catch (error) {
      return assertion(resolve, reject, null, error)
    } finally {
      if (executor) {
        await executor.dispose()
      }
    }
     */
  }

  setImmediate(execute)

  return {
    setAuthToken,
    setAssertion,
    getAssertion,
    isExecuted,
    promise,
  }
}
