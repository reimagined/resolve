import isEqual from 'lodash.isequal'
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

const stringifyError = (error: any): string => {
  if (!error) {
    return 'no error'
  }
  if (typeof error === 'string') {
    return error
  }
  if (error.message) {
    return error.message
  }
  return JSON.stringify(error, null, 2)
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
  context: BDDAggregateAssertionContext,
  expectedEvent: CommandResult
) => {
  const { [symbol]: state } = context
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
  return context
}

export const shouldThrow = (
  context: BDDAggregateAssertionContext,
  expectedError: any
) => {
  const { [symbol]: state } = context
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
          `expected error ${stringifyError(
            expectedError
          )}, but received ${stringifyError(error)}`
        )
      )
    }
    resolve(result)
  }
  state.isDefaultAssertion = false
  return context
}
