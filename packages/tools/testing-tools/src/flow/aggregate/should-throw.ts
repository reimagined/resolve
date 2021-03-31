import isEqual from 'lodash.isequal'
import { AggregateTestResult, CommandContext } from '../../types'
import { stringifyError } from '../../utils/format'

type ShouldThrowNode = Promise<AggregateTestResult>

export const shouldThrow = (
  context: CommandContext,
  expectedError: Error
): ShouldThrowNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Assertion cannot be assigned if the test was executed.`)
  }
  if (environment.getAssertion() != null) {
    throw Error(`The test assertion already assigned.`)
  }

  environment.setAssertion((resolve, reject, result, error) => {
    if (!error) {
      return reject(
        new Error(`expected an error, but received no error received`)
      )
    }
    if (!isEqual(error, expectedError)) {
      return reject(
        new Error(
          `expected error ${stringifyError(
            expectedError
          )}, but received ${stringifyError(error)}`
        )
      )
    }
    return resolve(result)
  })

  return environment.promise
}
