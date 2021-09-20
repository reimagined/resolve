import { initDomain, SecretsManager } from '@resolve-js/core'
import { createCommandExecutor } from '@resolve-js/runtime-base'
import { defaultAssertion } from '../../utils/assertions'

import { getSecretsManager } from '../../runtime/get-secrets-manager'
import { getEventStore } from '../../runtime/get-event-store'

import type { CommandExecutor } from '@resolve-js/runtime-base'
import type {
  CommandTestResult,
  TestAggregate,
  TestCommandAssertion,
  TestCommand,
  TestEvent,
} from '../../types'

type AggregateTestContext = {
  aggregate: TestAggregate
  events: TestEvent[]
  aggregateId?: string
  command: TestCommand
}
type TestCompleteCallback = (result: CommandTestResult) => void
type TestFailureCallback = (error: Error) => void

export type AggregateTestEnvironment = {
  promise: Promise<CommandTestResult>
  setAuthToken: (token: string) => void
  setSecretsManager: (manager: SecretsManager) => void
  setAssertion: (assertion: TestCommandAssertion) => void
  getAssertion: () => TestCommandAssertion
  isExecuted: () => boolean
}

export const makeTestEnvironment = (
  context: AggregateTestContext
): AggregateTestEnvironment => {
  let executed = false
  let authToken: string
  let assertion: TestCommandAssertion
  let secretsManager: SecretsManager = getSecretsManager()
  let completeTest: TestCompleteCallback
  let failTest: TestFailureCallback

  const setAuthToken = (value: string) => {
    authToken = value
  }
  const setSecretsManager = (value: SecretsManager) => {
    secretsManager = value
  }
  const setAssertion = (value: TestCommandAssertion) => {
    assertion = value
  }
  const getAssertion = () => {
    return assertion
  }
  const isExecuted = () => executed
  const promise = new Promise<CommandTestResult>((resolve, reject) => {
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
      executor = createCommandExecutor({
        performanceTracer: null,
        aggregatesInterop: domain.aggregateDomain.acquireAggregatesInterop({
          eventstore: await getEventStore(events, { aggregateId }),
          secretsManager,
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

      const testResult: CommandTestResult = {
        type: commandResult.type,
      }

      if (Object.prototype.hasOwnProperty.call(commandResult, 'payload')) {
        testResult.payload = commandResult.payload
      }

      return actualAssertion(completeTest, failTest, testResult, null, false)
    } catch (error) {
      return actualAssertion(completeTest, failTest, null, error, false)
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
