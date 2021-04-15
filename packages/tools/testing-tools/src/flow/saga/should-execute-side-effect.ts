import isEqual from 'lodash.isequal'
import { SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'
import { stringifySideEffectInvocation } from '../../utils/format'

export const shouldExecuteSideEffect = (
  context: SagaContext,
  name: string,
  ...args: any[]
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

    const expected = [name, ...args]

    const index = result
      ? result.sideEffects.findIndex((executed) => isEqual(executed, expected))
      : -1

    if (index >= 0) {
      return resolve(result)
    }
    return reject(
      new Error(
        `shouldExecuteSideEffect assertion failed:\n${stringifySideEffectInvocation(
          expected
        )}`
      )
    )
  })

  return makeAssertions(context)
}
