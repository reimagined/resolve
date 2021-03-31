import isEqual from 'lodash.isequal'
import { AggregateTestResult, CommandContext } from '../../types'
import { stringifyDiff } from '../../utils/format'

type ShouldProduceEventNode = Promise<AggregateTestResult>
type ExpectedEvent = AggregateTestResult

export const shouldProduceEvent = (
  context: CommandContext,
  expectedEvent: ExpectedEvent
): ShouldProduceEventNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Assertion cannot be assigned if the test was executed.`)
  }
  if (environment.getAssertion() != null) {
    throw Error(`The test assertion already assigned.`)
  }

  environment.setAssertion((resolve, reject, result, error) => {
    if (error) {
      return reject(
        new Error(`expected an event, but received an error ${error}`)
      )
    }
    if (!isEqual(result, expectedEvent)) {
      return reject(
        new Error(
          `shouldProduceEvent assertion failed:\n ${stringifyDiff(
            expectedEvent,
            result
          )}`
        )
      )
    }
    return resolve(result)
  })

  return environment.promise
}
