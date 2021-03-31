import { initDomain, SecretsManager } from '@resolve-js/core'
import {
  BDDReadModel,
  QueryTestResult,
  TestEvent,
  TestQuery,
} from '../../types'
import { prepareEvents } from '../../utils/prepare-events'
import { getDummySecretsManager } from '../../utils/get-dummy-secrets-manager'

type ReadModelTestContext = {
  readModel: BDDReadModel
  events: TestEvent[]
  query: TestQuery
}
type TestCompleteCallback = (result: QueryTestResult) => void
type TestFailureCallback = (error: Error) => void

export type ReadModelTestEnvironment = {
  promise: Promise<QueryTestResult>
  setAuthToken: (token: string) => void
  setSecretsManager: (manager: SecretsManager) => void
  isExecuted: () => boolean
}

export const makeTestEnvironment = (
  context: ReadModelTestContext
): ReadModelTestEnvironment => {
  let executed = false
  let authToken: string
  let secretsManager: SecretsManager = getDummySecretsManager()
  let completeTest: TestCompleteCallback
  let failTest: TestFailureCallback

  const setAuthToken = (value: string) => {
    authToken = value
  }
  const setSecretsManager = (value: SecretsManager) => {
    secretsManager = value
  }
  const isExecuted = () => executed
  const promise = new Promise<QueryTestResult>((resolve, reject) => {
    completeTest = resolve
    failTest = reject
  })

  const execute = async () => {
    executed = true

    completeTest('ok')
  }

  setImmediate(execute)

  return {
    setAuthToken,
    setSecretsManager,
    isExecuted,
    promise,
  }
}
