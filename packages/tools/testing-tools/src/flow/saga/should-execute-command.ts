import isEqual from 'lodash.isequal'
import { Command } from '@resolve-js/core'
import { SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'
import { stringifyCommand } from '../../utils/format'

export const shouldExecuteCommand = (
  context: SagaContext,
  command: Command
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
      ? result.commands.findIndex(([executed]) => isEqual(executed, command))
      : -1

    if (index >= 0) {
      return resolve(result)
    }
    return reject(
      new Error(
        `shouldExecuteCommand assertion failed:\nExpected command to be executed: ${stringifyCommand(command)}`
      )
    )
  })

  return makeAssertions(context)
}
