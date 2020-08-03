import isEqual from 'lodash.isEqual'
import { CommandResult } from 'resolve-core'
import { Phases, symbol } from './constants'

export type BDDAggregateAssertion = (
  resolve: Function,
  reject: Function,
  result: CommandResult | null,
  error: any
) => void

type BDDAggregateAssertionState = {
  phase: Phases
  assertion: BDDAggregateAssertion
  isDefaultAssertion: boolean
}

type BDDAggregateAssertionContext = {
  [symbol]: BDDAggregateAssertionState
}

const checkState = (state: BDDAggregateAssertionState): TypeError | null => {
  if (state.phase < Phases.COMMAND) {
    return new TypeError('invalid phase')
  }
  if (!state.isDefaultAssertion) {
    return new TypeError('assertion already assigned')
  }
  return null
}

export const shouldProduceEvent = (
  { [symbol]: state }: BDDAggregateAssertionContext,
  expectedEvent: CommandResult
) => {
  const invalidStateError = checkState(state)
  if (invalidStateError) {
    throw invalidStateError
  }
  state.assertion = (resolve, reject, result, error) => {
    if (error) {
      reject(new Error(`expected an event, but received an error ${error}`))
    }
    if (!isEqual(result, expectedEvent)) {
      reject(
        new Error(
          `expected event ${JSON.stringify(
            expectedEvent,
            null,
            2
          )}, but received ${JSON.stringify(result, null, 2)}`
        )
      )
    }
    resolve(result)
  }
  state.isDefaultAssertion = false
}

export const shouldThrow = (
  { [symbol]: state }: BDDAggregateAssertionContext,
  expectedError: any
) => {
  const invalidStateError = checkState(state)
  if (invalidStateError) {
    throw invalidStateError
  }
  state.assertion = (resolve, reject, result, error) => {
    if (!error) {
      reject(new Error(`expected an error, but received no error received`))
    }
    if (!isEqual(error, expectedError)) {
      reject(
        new Error(
          `expected error ${JSON.stringify(
            expectedError,
            null,
            2
          )}, but received ${JSON.stringify(error, null, 2)}`
        )
      )
    }
    resolve(result)
  }
  state.isDefaultAssertion = false
}
