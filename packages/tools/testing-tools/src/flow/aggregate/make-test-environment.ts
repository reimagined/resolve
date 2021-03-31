import { initDomain, SecretsManager } from '@resolve-js/core'
import { CommandExecutor, createCommand } from '@resolve-js/runtime'
import {
  AggregateTestResult,
  BDDAggregate,
  BDDAggregateAssertion,
  TestCommand,
  TestEvent,
} from '../../types'
import { getSecretsManager } from '../../runtime/get-secrets-manager'
import { getEventStore } from '../../runtime/get-event-store'

type AggregateTestContext = {
  aggregate: BDDAggregate
  events: TestEvent[]
  aggregateId?: string
  command: TestCommand
}
type TestCompleteCallback = (result: AggregateTestResult) => void
type TestFailureCallback = (error: Error) => void

export type AggregateTestEnvironment = {
  promise: Promise<AggregateTestResult>
  setAuthToken: (token: string) => void
  setSecretsManager: (manager: SecretsManager) => void
  setAssertion: (assertion: BDDAggregateAssertion) => void
  getAssertion: () => BDDAggregateAssertion
  isExecuted: () => boolean
}

const defaultAssertion: BDDAggregateAssertion = (
  resolve,
  reject,
  result,
  error
) => {
  if (error != null) {
    reject(error)
  } else {
    resolve(result)
  }
}

export const makeTestEnvironment = (
  context: AggregateTestContext
): AggregateTestEnvironment => {
  let executed = false
  let authToken: string
  let assertion: BDDAggregateAssertion
  let secretsManager: SecretsManager = getSecretsManager()
  let completeTest: TestCompleteCallback
  let failTest: TestFailureCallback

  const setAuthToken = (value: string) => {
    authToken = value
  }
  const setSecretsManager = (value: SecretsManager) => {
    secretsManager = value
  }
  const setAssertion = (value: BDDAggregateAssertion) => {
    assertion = value
  }
  const getAssertion = () => {
    return assertion
  }
  const isExecuted = () => executed
  const promise = new Promise<AggregateTestResult>((resolve, reject) => {
    completeTest = resolve
    failTest = reject
  })

  const execute = async () => {
    executed = true

    const {
      aggregate,
      events,
      command,
      aggregateId = 'test-aggregate-id',
    } = context

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

    let executor: CommandExecutor | null = null
    const actualAssertion = assertion != null ? assertion : defaultAssertion
    try {
      executor = createCommand({
        performanceTracer: null,
        aggregatesInterop: domain.aggregateDomain.acquireAggregatesInterop({
          eventstore: getEventStore(events, { aggregateId }),
          secretsManager,
          monitoring: {},
          hooks: {},
        }),
      })

      const commandResult = await executor({
        aggregateId: aggregateId,
        aggregateName: aggregate.name,
        type: command.name,
        payload: command.payload || {},
        jwt: authToken,
      })

      const testResult: AggregateTestResult = {
        type: commandResult.type,
      }

      if (Object.prototype.hasOwnProperty.call(commandResult, 'payload')) {
        testResult.payload = commandResult.payload
      }

      return actualAssertion(completeTest, failTest, testResult, null)
    } catch (error) {
      return actualAssertion(completeTest, failTest, null, error)
    } finally {
      if (executor) {
        await executor.dispose()
      }
    }
  }

  setImmediate(execute)

  return {
    setAuthToken,
    setSecretsManager,
    setAssertion,
    getAssertion,
    isExecuted,
    promise,
  }
}
