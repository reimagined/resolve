import { AggregateTestPromise, AggregateTestResult } from '../../types'

type AggregateTestPromiseContext = {}
export type AggregateTestEnvironment = {
  promise: Promise<AggregateTestResult>
  setAuthToken: (token: string) => void
  isExecuted: () => boolean
}

export const makeTestEnvironment = (
  context: AggregateTestPromiseContext
): AggregateTestEnvironment => {
  let executed = false
  let authToken: string
  let resolve: (result: AggregateTestResult) => void

  const setAuthToken = (token: string) => {
    authToken = token
  }
  const isExecuted = () => executed
  const promise = new Promise<AggregateTestResult>((promiseResolve) => {
    resolve = promiseResolve
  }).then(() => execute())

  const execute = () => {
    executed = true
    console.log(`executing with ${authToken}`)
    resolve({
      type: 'create',
      aggregateId: 'ok',
    })
    return {
      type: 'create',
      aggregateId: 'ok',
    }
  }

  return {
    setAuthToken,
    isExecuted,
    promise,
  }
}
