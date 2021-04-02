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

  environment.setAssertion((resolve, reject, result, error) => {
    if (error) {
      return reject(
        new Error(`expected a value, but received an error ${error}`)
      )
    }
    if (!isEqual(result, expectedResult)) {
      return reject(
        new Error(
          `shouldReturn assertion failed:\n ${stringifyDiff(
            expectedResult,
            result
          )}`
        )
      )
    }
    return resolve(result)
  })

  return environment.promise
}
