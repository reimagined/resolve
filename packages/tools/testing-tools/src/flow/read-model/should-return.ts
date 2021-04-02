import isEqual from 'lodash.isequal'
import { QueryTestResult, QueryContext } from '../../types'
import { stringifyDiff } from '../../utils/format'

type ShouldReturnNode = Promise<QueryTestResult>
type ExpectedResult = QueryTestResult

export const shouldReturn = (
  context: QueryContext,
  expectedResult: ExpectedResult
): ShouldReturnNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Assertion cannot be assigned if the test was executed.`)
  }
  if (environment.getAssertion() != null) {
    throw Error(`The test assertion already assigned.`)
  }

  environment.setAssertion((resolve, reject, result, error, negated) => {
    if (error) {
      return reject(
        new Error(`expected a value, but received an error ${error}`)
      )
    }

    let success = isEqual(result, expectedResult)
    if (negated) {
      success = !success
    }

    if (success) {
      return resolve(result)
    }
    return reject(
      new Error(
        `should${
          negated ? 'Not' : ''
        }Return assertion failed:\n ${stringifyDiff(expectedResult, result)}`
      )
    )
  })

  return environment.promise
}
