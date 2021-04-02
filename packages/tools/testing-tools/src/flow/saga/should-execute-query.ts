import isEqual from 'lodash.isequal'
import { ReadModelQuery } from '@resolve-js/core'
import { SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'
import { stringifyQuery } from '../../utils/format'

export const shouldExecuteQuery = (
  context: SagaContext,
  query: ReadModelQuery
): SagaAssertionsNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Assertion cannot be assigned if the test was executed.`)
  }

  environment.addAssertion((resolve, reject, result, error) => {
    if (error) {
      return reject(
        new Error(`expected a value, but received an error ${error}`)
      )
    }

    const index = result
      ? result.queries.findIndex((executed) => isEqual(executed, query))
      : -1

    if (index >= 0) {
      return resolve(result)
    }
    return reject(
      new Error(
        `shouldExecuteQuery assertion failed:\n${stringifyQuery(query)}`
      )
    )
  })

  return makeAssertions(context)
}
